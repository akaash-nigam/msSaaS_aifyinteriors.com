import { Request, Response, NextFunction } from "express";
import { getCreditBalance } from "../services/credits.service";

/**
 * Middleware to check if user has sufficient credits
 * Must be used after requireAuth middleware
 */
export function requireCredits(minCredits: number = 1) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required",
        });
        return;
      }

      // Paid tiers have unlimited credits
      if (req.user.tier !== "free") {
        console.log(`✅ User ${req.user.id} has unlimited credits (tier: ${req.user.tier})`);
        next();
        return;
      }

      // Check credit balance for free tier
      const balance = await getCreditBalance(req.user.id);

      if (balance < minCredits) {
        res.status(403).json({
          error: "Insufficient Credits",
          message: `You need ${minCredits} credit(s) but only have ${balance}. Please upgrade your plan to continue.`,
          currentBalance: balance,
          requiredCredits: minCredits,
          upgradeUrl: "/pricing",
        });
        return;
      }

      console.log(`✅ User ${req.user.id} has sufficient credits: ${balance}/${minCredits}`);
      next();
    } catch (error: any) {
      console.error("Credit check error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to check credit balance",
      });
    }
  };
}
