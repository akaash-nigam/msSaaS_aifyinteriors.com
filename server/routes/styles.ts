import { Router, Request, Response } from "express";
import { optionalAuth } from "../middleware/requireAuth";
import { storage } from "../storage";

const router = Router();

/**
 * GET /api/styles
 * Get all design styles (filtered by user tier if authenticated)
 */
router.get("/", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTier = req.user?.tier || "free";

    // Get all styles
    const allStyles = await storage.getDesignStyles();

    // Filter styles based on user tier
    const styles = allStyles.filter((style) => {
      if (userTier === "professional") return true; // Access to all
      if (userTier === "basic") return style.tier !== "professional"; // Exclude professional
      return style.tier === "free"; // Free tier only
    });

    res.json({ styles });
  } catch (error: any) {
    console.error("Error fetching styles:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch styles",
    });
  }
});

/**
 * GET /api/styles/:id
 * Get a single design style by ID
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const styleId = parseInt(req.params.id);

    if (isNaN(styleId)) {
      res.status(400).json({ error: "Invalid style ID" });
      return;
    }

    const style = await storage.getDesignStyle(styleId);

    if (!style) {
      res.status(404).json({ error: "Style not found" });
      return;
    }

    res.json({ style });
  } catch (error: any) {
    console.error("Error fetching style:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch style",
    });
  }
});

export default router;
