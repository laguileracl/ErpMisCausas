import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes-full";
import path from "path";
import fs from "fs";

const app = express();

// CRITICAL: Health endpoint MUST be absolutely first - no dependencies, no middleware
app.get("/health", (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Simple static file serving for production (no vite dependencies)
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // Serve index.html for SPA routes (excluding API and health endpoints)
    app.use("*", (req, res) => {
      if (req.originalUrl.startsWith("/api") || req.originalUrl === "/health") {
        return res.status(404).send("Not Found");
      }
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    // Fallback if no built assets exist
    app.use("*", (req, res) => {
      if (req.originalUrl.startsWith("/api") || req.originalUrl === "/health") {
        return res.status(404).send("Not Found");
      }
      res.status(200).send("ERP MisCausas - Production Server Running");
    });
  }

  // Use PORT environment variable for production deployment or default to 5000
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`Production server running on port ${port}`);
  });
})();