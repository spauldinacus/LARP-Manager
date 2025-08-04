// Admin stats endpoint for Vercel
import { db, characters, users, events } from '../lib/db.js';
import { requireAdmin } from '../lib/session.js';
import { count, gte, and, eq } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    const session = await requireAdmin(req, res);
    if (!session) return; // requireAdmin already sent error response
    
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get total character count
    const [{ totalCharacters }] = await db
      .select({ totalCharacters: count(characters.id) })
      .from(characters);

    // Get characters created last month
    const [{ totalCharactersLastMonth }] = await db
      .select({ totalCharactersLastMonth: count(characters.id) })
      .from(characters)
      .where(gte(characters.createdAt, lastMonth));

    // Get active players (users with characters)
    const [{ activePlayers }] = await db
      .select({ activePlayers: count(users.id) })
      .from(users)
      .innerJoin(characters, eq(users.id, characters.userId));

    // Simplified stats for now
    const stats = {
      totalCharacters: totalCharacters.toString(),
      totalCharactersLastMonth: totalCharactersLastMonth.toString(),
      activePlayers: activePlayers.toString(),
      activePlayersLastWeek: activePlayers.toString(), // Simplified
      totalEvents: "0", // Would need events count
      upcomingEvents: "0", // Would need upcoming events count
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ 
      message: 'Failed to get admin stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}