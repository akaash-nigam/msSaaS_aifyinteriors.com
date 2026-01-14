import { Request, Response, NextFunction } from "express";
import { auth } from "../firebase-admin";
import { storage } from "../storage";
import { checkAndResetMonthlyCredits } from "../services/credits.service";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        firebaseUid: string;
        email: string;
        tier: string;
      };
    }
  }
}

/**
 * Middleware to require Firebase authentication
 * Verifies Firebase ID token and syncs user to PostgreSQL
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      });
      return;
    }

    // Extract token
    const token = authHeader.split("Bearer ")[1];

    if (!token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "No authentication token provided",
      });
      return;
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth().verifyIdToken(token);
    } catch (error: any) {
      console.error("Token verification failed:", error.message);
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
      return;
    }

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || "";

    // Check if user exists in our database
    let user = await storage.getUserByFirebaseUid(firebaseUid);

    // If user doesn't exist, create them
    if (!user) {
      console.log(`📝 Creating new user: ${email} (${firebaseUid})`);

      user = await storage.createUser({
        firebaseUid,
        email,
        displayName: decodedToken.name || null,
        photoURL: decodedToken.picture || null,
        tier: "free",
        creditsBalance: 3, // Free tier starts with 3 credits
        creditsUsedThisMonth: 0,
        subscriptionStatus: "inactive",
      });

      console.log(`✅ User created: ID ${user.id}`);
    }

    // Check and reset monthly credits if needed
    await checkAndResetMonthlyCredits(user.id);

    // Attach user info to request
    req.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      tier: user.tier,
    };

    console.log(`🔐 Authenticated user: ${email} (ID: ${user.id}, Tier: ${user.tier})`);

    next();
  } catch (error: any) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication failed",
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that work both authenticated and unauthenticated
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      // No auth header, continue without user
      next();
      return;
    }

    const token = authHeader.split("Bearer ")[1];

    if (!token) {
      next();
      return;
    }

    // Try to verify token
    try {
      const decodedToken = await auth().verifyIdToken(token);
      const firebaseUid = decodedToken.uid;

      // Get user from database
      const user = await storage.getUserByFirebaseUid(firebaseUid);

      if (user) {
        req.user = {
          id: user.id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          tier: user.tier,
        };
      }
    } catch (error) {
      // Token invalid, but we don't fail - just continue without user
      console.log("Optional auth: Invalid token, continuing unauthenticated");
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next();
  }
}
