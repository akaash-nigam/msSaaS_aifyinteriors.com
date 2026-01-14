import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { storage } from "../storage";
import { getCreditBalance } from "../services/credits.service";

const router = Router();

/**
 * Request validation schemas
 */
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  photoURL: z.string().url().optional(),
});

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await storage.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Get current credit balance
    const creditsBalance = await getCreditBalance(userId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        tier: user.tier,
        subscriptionStatus: user.subscriptionStatus,
        creditsBalance,
        creditsUsedThisMonth: user.creditsUsedThisMonth,
        lastCreditReset: user.lastCreditReset,
        currentPeriodEnd: user.currentPeriodEnd,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch profile",
    });
  }
});

/**
 * PATCH /api/users/me
 * Update current user profile
 */
router.patch("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Validate request body
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation Error",
        details: validation.error.errors,
      });
      return;
    }

    // Update user profile
    const updatedUser = await storage.updateUser(userId, validation.data);

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        photoURL: updatedUser.photoURL,
      },
    });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update profile",
    });
  }
});

/**
 * GET /api/users/stats
 * Get user statistics
 */
router.get("/stats", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get design count
    const totalDesigns = await storage.getUserDesignsCount(userId);
    const favoriteDesigns = await storage.getUserDesignsCount(userId, { favoritesOnly: true });

    // Get credit transactions
    const creditTransactions = await storage.getCreditTransactions(userId);

    // Calculate total credits used
    const totalCreditsUsed = creditTransactions
      .filter((t) => t.type === "usage")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalCreditsPurchased = creditTransactions
      .filter((t) => t.type === "purchase")
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      stats: {
        totalDesigns,
        favoriteDesigns,
        totalCreditsUsed,
        totalCreditsPurchased,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch stats",
    });
  }
});

export default router;
