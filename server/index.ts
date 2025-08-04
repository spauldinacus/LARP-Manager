import express from "express";
import { ViteDevServer } from "vite";

async function createServer() {
  const app = express();
  
  // Add JSON parsing middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  let vite: ViteDevServer | undefined;

  if (process.env.NODE_ENV === "development") {
    // Create Vite server in middleware mode
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const path = await import("path");
    app.use(express.static(path.resolve("dist/public")));
  }

  // API Routes will be imported here when they exist
  const { setupApiRoutes } = await import("./routes").catch(() => ({ setupApiRoutes: () => {} }));
  await setupApiRoutes(app);

  // Serve index.html for client-side routing
  app.get("*", async (req, res, next) => {
    if (req.url.startsWith("/api")) {
      return next();
    }

    try {
      if (vite) {
        // Development: Use Vite to transform and serve
        const template = await vite.transformIndexHtml(req.originalUrl, 
          `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Thrune LARP Character Management</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
        );
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } else {
        // Production: Serve built files
        const path = await import("path");
        const fs = await import("fs");
        const indexPath = path.resolve("dist/public/index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Build files not found");
        }
      }
    } catch (e) {
      vite?.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  const port = Number(process.env.PORT) || 5000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${port}`);
    if (process.env.NODE_ENV === "development") {
      console.log(`📦 Vite dev server integrated`);
    }
  });
}

createServer().catch(console.error);