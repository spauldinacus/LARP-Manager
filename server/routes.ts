import express from "express";

export async function setupApiRoutes(app: express.Express) {
  console.log("setupApiRoutes called");
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Ping endpoint
  app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
  });

  // Import and setup other API routes from the existing serverless functions
  try {
    // Auth endpoints
    // @ts-ignore - JavaScript module without type declarations
    const { default: authHandler } = await import("../api/auth/index.js");
    app.all("/api/auth", authHandler);
    app.all("/api/auth/:action", (req, res) => {
      req.url = `/${req.params.action}`;
      authHandler(req, res);
    });

    // Characters endpoint
    // @ts-ignore - JavaScript module without type declarations
    const { default: charactersHandler } = await import("../api/characters.js");
    app.all("/api/characters", charactersHandler);
    app.all("/api/characters/:action", (req, res) => {
      req.url = `/${req.params.action}`;
      charactersHandler(req, res);
    });

    // Chapters endpoint
    // @ts-ignore - JavaScript module without type declarations
    const { default: chaptersHandler } = await import("../api/chapters.js");
    app.all("/api/chapters", chaptersHandler);

    // Events endpoint
    // @ts-ignore - JavaScript module without type declarations
    const { default: eventsHandler } = await import("../api/events.js");
    app.all("/api/events", eventsHandler);

    // Admin endpoint
    // @ts-ignore - JavaScript module without type declarations
    const { default: adminHandler } = await import("../api/admin.js");
    app.all("/api/admin", adminHandler);
    app.all("/api/admin/:action", (req, res) => {
      req.url = `/${req.params.action}`;
      adminHandler(req, res);
    });

    console.log("✅ API routes loaded successfully");
  } catch (error) {
    console.warn("⚠️ Some API routes failed to load:", error);
    console.error(error);
  }
}