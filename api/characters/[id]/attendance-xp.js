
// Character attendance XP endpoint for Vercel
import { db, experienceEntries, events } from '../../../lib/db.js';
import { getSessionData } from '../../../lib/session.js';
import { eq, and, isNotNull } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      const session = await getSessionData(req);
      if (!session) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const attendanceXp = await db
        .select({
          id: experienceEntries.id,
          amount: experienceEntries.amount,
          reason: experienceEntries.reason,
          eventId: experienceEntries.eventId,
          createdAt: experienceEntries.createdAt,
          event: {
            id: events.id,
            name: events.name,
            eventDate: events.eventDate,
          }
        })
        .from(experienceEntries)
        .leftJoin(events, eq(experienceEntries.eventId, events.id))
        .where(and(
          eq(experienceEntries.characterId, id),
          isNotNull(experienceEntries.eventId)
        ))
        .orderBy(experienceEntries.createdAt);

      return res.status(200).json(attendanceXp);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Attendance XP API error:', error);
    return res.status(500).json({ 
      message: 'Failed to get attendance XP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
