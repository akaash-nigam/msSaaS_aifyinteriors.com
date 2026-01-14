import { Router, Request, Response } from "express";
import { storage } from "../storage";

const router = Router();

/**
 * GET /api/room-types
 * Get all room types
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const roomTypes = await storage.getRoomTypes();
    res.json({ roomTypes });
  } catch (error: any) {
    console.error("Error fetching room types:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch room types",
    });
  }
});

/**
 * GET /api/room-types/:id
 * Get a single room type by ID
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const roomTypeId = parseInt(req.params.id);

    if (isNaN(roomTypeId)) {
      res.status(400).json({ error: "Invalid room type ID" });
      return;
    }

    const roomType = await storage.getRoomType(roomTypeId);

    if (!roomType) {
      res.status(404).json({ error: "Room type not found" });
      return;
    }

    res.json({ roomType });
  } catch (error: any) {
    console.error("Error fetching room type:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch room type",
    });
  }
});

export default router;
