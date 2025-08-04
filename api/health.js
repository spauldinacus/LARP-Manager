
// Health check endpoint for Vercel
import { db } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Test database connection
    await db.execute('SELECT 1');
    
    return res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
