import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { testDatabaseConnection } from "./db";
import { handleStripeWebhook } from "./stripe-webhook";

// Import routes
import designsRouter from "./routes/designs";
import stylesRouter from "./routes/styles";
import roomTypesRouter from "./routes/roomTypes";
import subscriptionsRouter from "./routes/subscriptions";
import usersRouter from "./routes/users";

const app = express();
const PORT = process.env.PORT || 5000;
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Security middleware
 */
app.use(
  helmet({
    contentSecurityPolicy: isDevelopment ? false : undefined,
    crossOriginEmbedderPolicy: isDevelopment ? false : undefined,
  })
);

/**
 * CORS configuration
 */
app.use(
  cors({
    origin: isDevelopment
      ? ["http://localhost:5000", "http://localhost:5173"]
      : ["https://aifyinteriors.com", "https://www.aifyinteriors.com"],
    credentials: true,
  })
);

/**
 * Stripe webhook endpoint (MUST use raw body)
 * This endpoint needs to be defined BEFORE express.json() middleware
 */
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: "10mb" })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Request logging middleware
 */
if (isDevelopment) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

/**
 * Health check endpoint
 */
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    await testDatabaseConnection();
    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * API Routes
 */
app.use("/api/designs", designsRouter);
app.use("/api/styles", stylesRouter);
app.use("/api/room-types", roomTypesRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/users", usersRouter);

/**
 * Serve static files from Vite build in production
 */
if (!isDevelopment) {
  app.use(express.static("dist/public"));

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req: Request, res: Response) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile("index.html", { root: "dist/public" });
    } else {
      res.status(404).json({ error: "Not Found" });
    }
  });
}

/**
 * 404 handler for API routes
 */
app.use("/api/*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `API endpoint ${req.method} ${req.path} not found`,
  });
});

/**
 * Global error handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Unhandled error:", err);

  res.status(500).json({
    error: "Internal Server Error",
    message: isDevelopment ? err.message : "An unexpected error occurred",
    ...(isDevelopment && { stack: err.stack }),
  });
});

/**
 * Start server
 */
async function startServer() {
  try {
    // Test database connection
    console.log("🔌 Testing database connection...");
    await testDatabaseConnection();

    // Start listening
    app.listen(PORT, () => {
      console.log("\n✅ AIfy Interiors Server Started");
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API endpoints: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);

      if (isDevelopment) {
        console.log(`\n💡 Development mode enabled`);
        console.log(`   Frontend: http://localhost:5173`);
        console.log(`   Backend: http://localhost:${PORT}`);
      }

      console.log("\n📋 Available API Routes:");
      console.log("   POST   /api/designs/generate");
      console.log("   GET    /api/designs/my-designs");
      console.log("   GET    /api/designs/:id");
      console.log("   PATCH  /api/designs/:id");
      console.log("   DELETE /api/designs/:id");
      console.log("   GET    /api/styles");
      console.log("   GET    /api/room-types");
      console.log("   GET    /api/subscriptions/pricing");
      console.log("   POST   /api/subscriptions/create-checkout");
      console.log("   GET    /api/users/me");
      console.log("   POST   /api/stripe/webhook");
      console.log("");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("⚠️  SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT signal received: closing HTTP server");
  process.exit(0);
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the server
startServer();
