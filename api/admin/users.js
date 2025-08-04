
// Users management endpoint for Vercel
import { db, users, characters } from '../../lib/db.js';
import { requireAdmin } from '../../lib/session.js';
import { eq, count } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const session = await requireAdmin(req, res);
      if (!session) return;

      const usersWithCharacterCounts = await db
        .select({
          id: users.id,
          playerName: users.playerName,
          email: users.email,
          isAdmin: users.isAdmin,
          roleId: users.roleId,
          candles: users.candles,
          playerNumber: users.playerNumber,
          chapterId: users.chapterId,
          title: users.title,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          characterCount: count(characters.id),
        })
        .from(users)
        .leftJoin(characters, eq(users.id, characters.userId))
        .groupBy(users.id, users.playerName, users.email, users.isAdmin, users.roleId, users.candles, users.playerNumber, users.chapterId, users.title, users.createdAt, users.updatedAt)
        .orderBy(users.playerName);

      return res.status(200).json(usersWithCharacterCounts);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ 
      message: 'Failed to process users request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
