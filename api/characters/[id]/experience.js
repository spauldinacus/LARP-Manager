
// Character experience history API endpoint for Vercel
import { db, experienceEntries, events } from '../../../lib/db.js';
import { getSessionData } from '../../../lib/session.js';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Character ID is required' });
    }

    if (req.method === 'GET') {
      // Get character experience history
      const experienceHistory = await db
        .select({
          id: experienceEntries.id,
          characterId: experienceEntries.characterId,
          amount: experienceEntries.amount,
          reason: experienceEntries.reason,
          eventId: experienceEntries.eventId,
          rsvpId: experienceEntries.rsvpId,
          awardedBy: experienceEntries.awardedBy,
          createdAt: experienceEntries.createdAt,
          event: {
            id: events.id,
            name: events.name,
            eventDate: events.eventDate,
          },
        })
        .from(experienceEntries)
        .leftJoin(events, eq(experienceEntries.eventId, events.id))
        .where(eq(experienceEntries.characterId, id))
        .orderBy(desc(experienceEntries.createdAt));

      return res.status(200).json(experienceHistory);
    }

    if (req.method === 'POST') {
      // Add experience entry - require authentication
      const session = await getSessionData(req);
      if (!session) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { amount, reason, eventId } = req.body;

      const [newEntry] = await db
        .insert(experienceEntries)
        .values({
          characterId: id,
          amount,
          reason,
          eventId: eventId || null,
          awardedBy: session.userId,
        })
        .returning();

      return res.status(201).json(newEntry);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Character experience API error:', error);
    return res.status(500).json({ 
      message: 'Failed to process experience request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
