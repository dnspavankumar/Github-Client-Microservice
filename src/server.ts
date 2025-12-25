import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { config } from "./config";
import logger from "./utils/logger";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import vectorStoreService from "./services/VectorStoreService";

const app: Express = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow extension to work
  }),
);

// CORS configuration for Chrome extension
app.use(
  cors({
    origin: ["http://localhost:3000", "chrome-extension://*"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Request parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression
app.use(compression());

// Request logging
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === "/health",
    },
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

// Routes
app.use("/api/v1", routes);

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    name: "GitHub RAG Microservice",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/v1/health",
      stats: "/api/v1/stats",
      ingest: "POST /api/v1/ingest",
      query: "POST /api/v1/query",
      status: "GET /api/v1/status/:jobId",
      delete: "DELETE /api/v1/repo/:repoId",
    },
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, "Received shutdown signal");

  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      // Close connections
      await Promise.all([
        import("./services/CacheService").then((m) => m.default.close()),
      ]);

      logger.info("All connections closed");
      process.exit(0);
    } catch (error) {
      logger.error({ error }, "Error during shutdown");
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
const server = app.listen(config.server.port, async () => {
  logger.info(
    {
      port: config.server.port,
      env: config.server.nodeEnv,
    },
    "Server started",
  );

  // Initialize services
  try {
    await vectorStoreService.initialize();
    logger.info("Services initialized");
  } catch (error) {
    logger.error({ error }, "Failed to initialize services");
    process.exit(1);
  }
});

export default app;
