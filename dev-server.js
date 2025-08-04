
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import and setup API routes dynamically
const setupApiRoutes = async () => {
  // Health endpoint
  const { default: healthHandler } = await import('./api/health.js');
  app.all('/api/health', healthHandler);

  // Ping endpoint
  const { default: pingHandler } = await import('./api/ping.js');
  app.all('/api/ping', pingHandler);

  // Auth endpoints (consolidated)
  const { default: authHandler } = await import('./api/auth/index.js');
  app.all('/api/auth', (req, res) => authHandler(req, res));
  app.all('/api/auth/:action', (req, res) => {
    req.url = `/${req.params.action}`;
    authHandler(req, res);
  });

  // Characters endpoint
  const { default: charactersHandler } = await import('./api/characters.js');
  app.all('/api/characters', (req, res) => charactersHandler(req, res));
  app.all('/api/characters/:action', (req, res) => {
    req.url = `/${req.params.action}`;
    charactersHandler(req, res);
  });

  // Chapters endpoint
  const { default: chaptersHandler } = await import('./api/chapters.js');
  app.all('/api/chapters', (req, res) => chaptersHandler(req, res));

  // Events endpoint
  const { default: eventsHandler } = await import('./api/events.js');
  app.all('/api/events', (req, res) => eventsHandler(req, res));

  // Admin endpoints (consolidated)
  const { default: adminHandler } = await import('./api/admin.js');
  app.all('/api/admin', (req, res) => adminHandler(req, res));
  app.all('/api/admin/:action', (req, res) => {
    req.url = `/${req.params.action}`;
    adminHandler(req, res);
  });
};

// Setup API routes
await setupApiRoutes();

// Serve static files from dist directory
const distPath = path.join(__dirname, 'dist/public');
app.use(express.static(distPath));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build files not found. Run "npm run build" first.');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Serverless dev server running on http://0.0.0.0:${port}`);
  console.log('📦 Serving static files from dist/public');
  console.log('🔌 API routes available at /api/*');
  console.log('');
  console.log('To test serverless functions:');
  console.log('1. Make sure you have built the frontend: npm run build');
  console.log('2. Access the app at the URL above');
});
