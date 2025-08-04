// Events API endpoint for Vercel
import { db, events } from './lib/db.js';
import { getSessionData, requireAdmin } from './lib/session.js';
import { desc } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all events - accessible to authenticated users
      const session = await getSessionData(req);
      if (!session) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const allEvents = await db
        .select()
        .from(events)
        .orderBy(desc(events.date));

      return res.status(200).json(allEvents);
    }
    
    if (req.method === 'POST') {
      // Create new event - admin only
      const session = await requireAdmin(req, res);
      if (!session) return; // requireAdmin already sent error response
      
      const [newEvent] = await db.insert(events)
        .values(req.body)
        .returning();
      
      return res.status(201).json(newEvent);
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Events API error:', error);
    return res.status(500).json({ 
      message: 'Failed to process events request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}