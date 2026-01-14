import type { Request, Response } from "express";
import Stripe from "stripe";
import { constructWebhookEvent } from "./stripe";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Handle Stripe webhook events
 * This endpoint must use express.raw() middleware to preserve the raw request body
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    console.error("Missing or invalid stripe-signature header");
    return res.status(400).json({ error: "Missing or invalid stripe-signature header" });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).json({ error: `Webhook Error: ${(err as Error).message}` });
  }

  console.log(`🎫 Received Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook event ${event.type}:`, err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Handle successful checkout session completion
 * This is triggered when a user successfully completes subscription checkout
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("✅ Processing checkout.session.completed:", session.id);

  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;

  if (!userId || !tier) {
    console.error("Missing metadata in checkout session:", session.metadata);
    throw new Error("Missing required metadata in checkout session");
  }

  const userIdNum = parseInt(userId);

  // Get subscription ID
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    console.error("No subscription ID in checkout session");
    throw new Error("No subscription ID in checkout session");
  }

  // Verify user exists
  const user = await storage.getUserById(userIdNum);
  if (!user) {
    console.error(`User not found: ${userIdNum}`);
    throw new Error(`User not found: ${userIdNum}`);
  }

  // Update user tier and subscription status
  await db
    .update(users)
    .set({
      tier: tier as any,
      subscriptionStatus: "active",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userIdNum));

  console.log(`✅ Activated ${tier} subscription for user ${userIdNum}`);
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("📝 Processing customer.subscription.created:", subscription.id);

  const userId = subscription.metadata?.userId;
  const tier = subscription.metadata?.tier;

  if (!userId || !tier) {
    console.error("Missing metadata in subscription:", subscription.metadata);
    return;
  }

  const userIdNum = parseInt(userId);

  // Create subscription record
  await storage.createSubscription({
    userId: userIdNum,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0].price.id,
    tier: tier as any,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  console.log(`✅ Created subscription record for user ${userIdNum}`);
}

/**
 * Handle subscription updates (tier changes, cancellations, etc.)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("🔄 Processing customer.subscription.updated:", subscription.id);

  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error("Missing userId in subscription metadata");
    return;
  }

  const userIdNum = parseInt(userId);

  // Get user
  const user = await storage.getUserById(userIdNum);
  if (!user) {
    console.error(`User not found: ${userIdNum}`);
    return;
  }

  // Update user subscription status
  let newStatus: string = "active";
  let newTier = user.tier;

  if (subscription.status === "canceled" || subscription.status === "unpaid") {
    newStatus = "cancelled";
    newTier = "free"; // Downgrade to free tier
  } else if (subscription.status === "past_due") {
    newStatus = "past_due";
  } else if (subscription.cancel_at_period_end) {
    newStatus = "active"; // Still active until period ends
  }

  await db
    .update(users)
    .set({
      tier: newTier as any,
      subscriptionStatus: newStatus,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userIdNum));

  // Update subscription record
  const existingSubscription = await storage.getSubscriptionByUserId(userIdNum);
  if (existingSubscription) {
    await storage.updateSubscription(existingSubscription.id, {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }

  console.log(`✅ Updated subscription for user ${userIdNum}: ${newStatus}, tier: ${newTier}`);
}

/**
 * Handle subscription deletion (when subscription ends)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("❌ Processing customer.subscription.deleted:", subscription.id);

  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error("Missing userId in subscription metadata");
    return;
  }

  const userIdNum = parseInt(userId);

  // Downgrade user to free tier
  await db
    .update(users)
    .set({
      tier: "free",
      subscriptionStatus: "cancelled",
      creditsBalance: 3, // Reset to free tier credits
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userIdNum));

  // Update subscription record
  const existingSubscription = await storage.getSubscriptionByUserId(userIdNum);
  if (existingSubscription) {
    await storage.updateSubscription(existingSubscription.id, {
      status: "canceled",
    });
  }

  console.log(`✅ Downgraded user ${userIdNum} to free tier`);
}

/**
 * Handle successful invoice payment (monthly renewals)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("💰 Processing invoice.payment_succeeded:", invoice.id);

  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log("Invoice is not for a subscription, skipping");
    return;
  }

  // No action needed - subscription.updated event will handle any changes
  console.log(`✅ Payment succeeded for subscription ${subscriptionId}`);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.error("❌ Processing invoice.payment_failed:", invoice.id);

  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;

  if (!subscriptionId) {
    console.log("Invoice is not for a subscription, skipping");
    return;
  }

  // Find user by Stripe customer ID
  const user = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .then((rows) => rows[0]);

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Update user status to past_due
  await db
    .update(users)
    .set({
      subscriptionStatus: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  console.log(`⚠️  Marked user ${user.id} as past_due due to failed payment`);

  // TODO: Send email notification to user about failed payment
}
