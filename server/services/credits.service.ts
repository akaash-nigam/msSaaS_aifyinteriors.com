import { storage } from "../storage";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import type { CreditTransaction } from "@shared/schema";

/**
 * Deduct credits from user account atomically
 * Uses database transaction with row-level locking to prevent race conditions
 */
export async function deductCredits(
  userId: number,
  amount: number = 1,
  description: string = "Design generation"
): Promise<CreditTransaction> {
  // Use a database transaction with row locking
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .for("update") // Row-level lock
    .then((rows) => rows[0]);

  if (!user) {
    throw new Error("User not found");
  }

  const currentBalance = user.creditsBalance;

  // Check if user has sufficient credits
  if (currentBalance < amount) {
    throw new Error(
      `Insufficient credits. You have ${currentBalance} credits but need ${amount}. Please upgrade your plan.`
    );
  }

  const newBalance = currentBalance - amount;

  // Update user's credit balance
  await db
    .update(users)
    .set({
      creditsBalance: newBalance,
      creditsUsedThisMonth: user.creditsUsedThisMonth + amount,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Create credit transaction record
  const transaction = await storage.createCreditTransaction({
    userId,
    type: "usage",
    amount: -amount, // Negative for deduction
    balanceAfter: newBalance,
    description,
  });

  console.log(
    `💳 Deducted ${amount} credit(s) from user ${userId}. New balance: ${newBalance}`
  );

  return transaction;
}

/**
 * Refund credits back to user (e.g., when generation fails)
 */
export async function refundCredits(
  userId: number,
  designId: number,
  amount: number = 1
): Promise<CreditTransaction> {
  // Get user with row lock
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .for("update")
    .then((rows) => rows[0]);

  if (!user) {
    throw new Error("User not found");
  }

  const newBalance = user.creditsBalance + amount;

  // Update user's credit balance
  await db
    .update(users)
    .set({
      creditsBalance: newBalance,
      creditsUsedThisMonth: Math.max(0, user.creditsUsedThisMonth - amount),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Create refund transaction record
  const transaction = await storage.createCreditTransaction({
    userId,
    type: "refund",
    amount: amount, // Positive for refund
    balanceAfter: newBalance,
    description: `Refund for failed design generation (ID: ${designId})`,
    designId,
  });

  console.log(
    `💸 Refunded ${amount} credit(s) to user ${userId}. New balance: ${newBalance}`
  );

  return transaction;
}

/**
 * Add credits to user account (e.g., from purchase or bonus)
 */
export async function addCredits(
  userId: number,
  amount: number,
  description: string,
  stripePaymentIntentId?: string
): Promise<CreditTransaction> {
  // Get user with row lock
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .for("update")
    .then((rows) => rows[0]);

  if (!user) {
    throw new Error("User not found");
  }

  const newBalance = user.creditsBalance + amount;

  // Update user's credit balance
  await db
    .update(users)
    .set({
      creditsBalance: newBalance,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Create credit transaction record
  const transaction = await storage.createCreditTransaction({
    userId,
    type: "purchase",
    amount: amount, // Positive for addition
    balanceAfter: newBalance,
    description,
    stripePaymentIntentId,
  });

  console.log(
    `💰 Added ${amount} credit(s) to user ${userId}. New balance: ${newBalance}`
  );

  return transaction;
}

/**
 * Get user's current credit balance
 */
export async function getCreditBalance(userId: number): Promise<number> {
  const user = await storage.getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user.creditsBalance;
}

/**
 * Reset monthly credits for free tier users
 * This should be run as a cron job on the 1st of each month
 */
export async function resetMonthlyCredits(userId: number): Promise<void> {
  const user = await storage.getUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Only reset for free tier users
  if (user.tier !== "free") {
    console.log(`Skipping credit reset for user ${userId} (tier: ${user.tier})`);
    return;
  }

  const FREE_TIER_MONTHLY_CREDITS = 3;

  // Reset to 3 credits for free tier
  await db
    .update(users)
    .set({
      creditsBalance: FREE_TIER_MONTHLY_CREDITS,
      creditsUsedThisMonth: 0,
      monthlyResetDate: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Create transaction record
  await storage.createCreditTransaction({
    userId,
    type: "monthly_reset",
    amount: FREE_TIER_MONTHLY_CREDITS,
    balanceAfter: FREE_TIER_MONTHLY_CREDITS,
    description: "Monthly credit reset for free tier",
  });

  console.log(`🔄 Reset monthly credits for user ${userId} to ${FREE_TIER_MONTHLY_CREDITS}`);
}

/**
 * Check if user needs monthly credit reset
 */
export async function checkAndResetMonthlyCredits(userId: number): Promise<void> {
  const user = await storage.getUserById(userId);

  if (!user || user.tier !== "free") {
    return;
  }

  const now = new Date();
  const lastReset = user.monthlyResetDate ? new Date(user.monthlyResetDate) : null;

  // Check if it's been more than 30 days since last reset
  if (!lastReset || daysSince(lastReset) >= 30) {
    await resetMonthlyCredits(userId);
  }
}

/**
 * Helper function to calculate days between dates
 */
function daysSince(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get credit transaction history for a user
 */
export async function getCreditHistory(
  userId: number,
  limit: number = 50
): Promise<CreditTransaction[]> {
  return await storage.getCreditTransactions(userId, limit);
}

/**
 * Check if user has sufficient credits for an operation
 */
export async function hassufficientCredits(
  userId: number,
  requiredCredits: number = 1
): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  return balance >= requiredCredits;
}
