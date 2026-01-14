import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { storage } from "../storage";
import {
  createSubscriptionCheckoutSession,
  cancelSubscription,
  reactivateSubscription,
  createBillingPortalSession,
  pricingTiers,
} from "../stripe";

const router = Router();

/**
 * Request validation schemas
 */
const createCheckoutSchema = z.object({
  tierId: z.enum(["basic", "professional"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

/**
 * GET /api/subscriptions/pricing
 * Get all pricing tiers (public endpoint)
 */
router.get("/pricing", async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ tiers: pricingTiers });
  } catch (error: any) {
    console.error("Error fetching pricing:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch pricing",
    });
  }
});

/**
 * GET /api/subscriptions/my-subscription
 * Get current user's subscription details
 */
router.get("/my-subscription", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await storage.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const subscription = await storage.getSubscriptionByUserId(userId);

    res.json({
      tier: user.tier,
      subscriptionStatus: user.subscriptionStatus,
      creditsBalance: user.creditsBalance,
      currentPeriodEnd: user.currentPeriodEnd,
      subscription: subscription || null,
    });
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch subscription",
    });
  }
});

/**
 * POST /api/subscriptions/create-checkout
 * Create Stripe checkout session for subscription
 */
router.post("/create-checkout", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = createCheckoutSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation Error",
        details: validation.error.errors,
      });
      return;
    }

    const { tierId, successUrl, cancelUrl } = validation.data;
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    // Check if user already has an active subscription
    const user = await storage.getUserById(userId);
    if (user?.subscriptionStatus === "active" && user.tier !== "free") {
      res.status(400).json({
        error: "Already Subscribed",
        message: "You already have an active subscription. Use the billing portal to manage it.",
      });
      return;
    }

    // Create Stripe checkout session
    const session = await createSubscriptionCheckoutSession(
      userId,
      userEmail,
      tierId,
      successUrl,
      cancelUrl
    );

    console.log(`✅ Created checkout session for user ${userId}: ${session.id}`);

    res.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({
      error: "Checkout Failed",
      message: error.message,
    });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel current subscription (cancel at period end)
 */
router.post("/cancel", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await storage.getUserById(userId);
    if (!user || !user.stripeSubscriptionId) {
      res.status(400).json({ error: "No active subscription found" });
      return;
    }

    // Cancel subscription at period end
    const subscription = await cancelSubscription(user.stripeSubscriptionId, true);

    console.log(`📅 Subscription ${subscription.id} will cancel at period end for user ${userId}`);

    res.json({
      success: true,
      message: "Subscription will cancel at the end of the billing period",
      cancelAt: new Date(subscription.current_period_end * 1000),
    });
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({
      error: "Cancellation Failed",
      message: error.message,
    });
  }
});

/**
 * POST /api/subscriptions/reactivate
 * Reactivate a cancelled subscription
 */
router.post("/reactivate", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await storage.getUserById(userId);
    if (!user || !user.stripeSubscriptionId) {
      res.status(400).json({ error: "No subscription found" });
      return;
    }

    // Reactivate subscription
    const subscription = await reactivateSubscription(user.stripeSubscriptionId);

    console.log(`✅ Subscription ${subscription.id} reactivated for user ${userId}`);

    res.json({
      success: true,
      message: "Subscription reactivated successfully",
    });
  } catch (error: any) {
    console.error("Error reactivating subscription:", error);
    res.status(500).json({
      error: "Reactivation Failed",
      message: error.message,
    });
  }
});

/**
 * POST /api/subscriptions/billing-portal
 * Create Stripe billing portal session
 */
router.post("/billing-portal", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const returnUrl = (req.body.returnUrl as string) || "https://aifyinteriors.com/account";

    const user = await storage.getUserById(userId);
    if (!user || !user.stripeCustomerId) {
      res.status(400).json({ error: "No billing account found" });
      return;
    }

    // Create billing portal session
    const session = await createBillingPortalSession(user.stripeCustomerId, returnUrl);

    res.json({
      success: true,
      portalUrl: session.url,
    });
  } catch (error: any) {
    console.error("Error creating billing portal session:", error);
    res.status(500).json({
      error: "Billing Portal Failed",
      message: error.message,
    });
  }
});

export default router;
