import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { requireCredits } from "../middleware/requireCredits";
import { storage } from "../storage";
import { generateRoomDesign } from "../services/dalle.service";
import { deductCredits, refundCredits } from "../services/credits.service";
import type { InsertDesign } from "../../shared/schema";

const router = Router();

/**
 * Request validation schemas
 */
const generateDesignSchema = z.object({
  originalImage: z.string().min(1, "Original image is required"),
  styleId: z.number().int().positive("Valid style ID is required"),
  roomTypeId: z.number().int().positive("Valid room type ID is required"),
  customPrompt: z.string().optional(),
  generateAlternatives: z.boolean().optional().default(false),
});

const updateDesignSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isFavorite: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

/**
 * POST /api/designs/generate
 * Generate a new interior design using DALL-E 3
 */
router.post(
  "/generate",
  requireAuth,
  requireCredits(1),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validation = generateDesignSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: "Validation Error",
          details: validation.error.errors,
        });
        return;
      }

      const { originalImage, styleId, roomTypeId, customPrompt, generateAlternatives } = validation.data;
      const userId = req.user!.id;
      const userTier = req.user!.tier;

      // Verify style and room type exist
      const style = await storage.getDesignStyle(styleId);
      const roomType = await storage.getRoomType(roomTypeId);

      if (!style) {
        res.status(404).json({ error: "Style not found" });
        return;
      }

      if (!roomType) {
        res.status(404).json({ error: "Room type not found" });
        return;
      }

      // Check tier access for premium styles
      if (style.tier !== "free" && userTier === "free") {
        res.status(403).json({
          error: "Premium Style Requires Subscription",
          message: `The "${style.name}" style is only available for paid subscribers.`,
          upgradeUrl: "/pricing",
        });
        return;
      }

      console.log(`🎨 Generating design for user ${userId}: ${style.name} ${roomType.name}`);

      // Deduct credits BEFORE generation (atomic operation)
      let creditTransaction;
      try {
        creditTransaction = await deductCredits(
          userId,
          1,
          `${style.name} ${roomType.name} design generation`
        );
      } catch (error: any) {
        res.status(403).json({
          error: "Insufficient Credits",
          message: error.message,
          upgradeUrl: "/pricing",
        });
        return;
      }

      // Generate design with DALL-E 3
      let generationResult;
      let designId: number | undefined;

      try {
        generationResult = await generateRoomDesign(
          {
            originalImage,
            styleId,
            roomTypeId,
            customPrompt,
            generateAlternatives: generateAlternatives && userTier !== "free", // Free tier gets 1 image only
          },
          userId
        );

        // Save design to database
        const hasWatermark = userTier === "free";

        const designData: InsertDesign = {
          userId,
          originalImage,
          generatedImage: generationResult.generatedImage,
          styleId,
          roomTypeId,
          customPrompt: customPrompt || null,
          hasWatermark,
          metadata: generationResult.metadata,
          generationCost: generationResult.metadata.estimatedCost,
          isFavorite: false,
          isPublic: false,
        };

        const savedDesign = await storage.createDesign(designData);
        designId = savedDesign.id;

        console.log(`✅ Design ${designId} generated successfully for user ${userId}`);

        // Return success response
        res.status(201).json({
          success: true,
          design: {
            id: savedDesign.id,
            generatedImage: savedDesign.generatedImage,
            alternativeViews: generationResult.alternativeViews,
            hasWatermark: savedDesign.hasWatermark,
            style: style.name,
            roomType: roomType.name,
            creditsRemaining: creditTransaction.balanceAfter,
            metadata: generationResult.metadata,
          },
        });
      } catch (error: any) {
        console.error("❌ Design generation failed:", error);

        // Refund credits on failure
        await refundCredits(
          userId,
          designId,
          1,
          `Refund for failed ${style.name} ${roomType.name} generation`
        );

        res.status(500).json({
          error: "Design Generation Failed",
          message: "Failed to generate design. Your credit has been refunded.",
          details: error.message,
        });
      }
    } catch (error: any) {
      console.error("Error in generate design endpoint:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      });
    }
  }
);

/**
 * GET /api/designs/my-designs
 * Get all designs for the authenticated user
 */
router.get("/my-designs", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Parse query parameters for filtering and pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const styleId = req.query.styleId ? parseInt(req.query.styleId as string) : undefined;
    const roomTypeId = req.query.roomTypeId ? parseInt(req.query.roomTypeId as string) : undefined;
    const favoritesOnly = req.query.favoritesOnly === "true";

    const offset = (page - 1) * limit;

    // Get user designs with filters
    const designs = await storage.getUserDesigns(userId, {
      limit,
      offset,
      styleId,
      roomTypeId,
      favoritesOnly,
    });

    // Get total count for pagination
    const totalCount = await storage.getUserDesignsCount(userId, {
      styleId,
      roomTypeId,
      favoritesOnly,
    });

    res.json({
      designs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + designs.length < totalCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user designs:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch designs",
    });
  }
});

/**
 * GET /api/designs/:id
 * Get a single design by ID (with ownership check)
 */
router.get("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const designId = parseInt(req.params.id);
    const userId = req.user!.id;

    if (isNaN(designId)) {
      res.status(400).json({ error: "Invalid design ID" });
      return;
    }

    const design = await storage.getDesign(designId);

    if (!design) {
      res.status(404).json({ error: "Design not found" });
      return;
    }

    // Check ownership or public access
    if (design.userId !== userId && !design.isPublic) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({ design });
  } catch (error: any) {
    console.error("Error fetching design:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch design",
    });
  }
});

/**
 * PATCH /api/designs/:id
 * Update design metadata (title, favorite, public)
 */
router.patch("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const designId = parseInt(req.params.id);
    const userId = req.user!.id;

    if (isNaN(designId)) {
      res.status(400).json({ error: "Invalid design ID" });
      return;
    }

    // Validate request body
    const validation = updateDesignSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation Error",
        details: validation.error.errors,
      });
      return;
    }

    // Verify ownership
    const design = await storage.getDesign(designId);
    if (!design) {
      res.status(404).json({ error: "Design not found" });
      return;
    }

    if (design.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Update design
    const updatedDesign = await storage.updateDesign(designId, validation.data);

    res.json({
      success: true,
      design: updatedDesign,
    });
  } catch (error: any) {
    console.error("Error updating design:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update design",
    });
  }
});

/**
 * DELETE /api/designs/:id
 * Delete a design (ownership check required)
 */
router.delete("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const designId = parseInt(req.params.id);
    const userId = req.user!.id;

    if (isNaN(designId)) {
      res.status(400).json({ error: "Invalid design ID" });
      return;
    }

    // Verify ownership
    const design = await storage.getDesign(designId);
    if (!design) {
      res.status(404).json({ error: "Design not found" });
      return;
    }

    if (design.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Delete design
    await storage.deleteDesign(designId);

    console.log(`🗑️  Design ${designId} deleted by user ${userId}`);

    res.json({
      success: true,
      message: "Design deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting design:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete design",
    });
  }
});

export default router;
