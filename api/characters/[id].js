// Individual character management endpoint for Vercel
import { db, characters, users, heritagesTable, culturesTable, archetypesTable } from '../../lib/db.js';
import { getSessionData, requireAdmin } from '../../lib/session.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      // Get single character with all details
      const [characterWithDetails] = await db
        .select({
          id: characters.id,
          name: characters.name,
          userId: characters.userId,
          heritage: heritagesTable.name,
          culture: culturesTable.name,
          archetype: archetypesTable.name,
          body: characters.body,
          stamina: characters.stamina,
          experience: characters.experience,
          totalXpSpent: characters.totalXpSpent,
          skills: characters.skills,
          isActive: characters.isActive,
          isRetired: characters.isRetired,
          retiredAt: characters.retiredAt,
          retirementReason: characters.retirementReason,
          createdAt: characters.createdAt,
          updatedAt: characters.updatedAt,
          playerName: users.playerName,
          playerTitle: users.title,
          playerNumber: users.playerNumber,
        })
        .from(characters)
        .leftJoin(users, eq(characters.userId, users.id))
        .leftJoin(heritagesTable, eq(characters.heritage, heritagesTable.id))
        .leftJoin(culturesTable, eq(characters.culture, culturesTable.id))
        .leftJoin(archetypesTable, eq(characters.archetype, archetypesTable.id))
        .where(eq(characters.id, id));

      if (!characterWithDetails) {
        return res.status(404).json({ message: 'Character not found' });
      }

      return res.status(200).json(characterWithDetails);
    }

    if (req.method === 'PUT') {
      const session = await getSessionData(req);
      if (!session) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if user owns character or is admin
      const [character] = await db.select().from(characters).where(eq(characters.id, id));
      if (!character) {
        return res.status(404).json({ message: 'Character not found' });
      }

      if (character.userId !== session.userId && !session.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to update this character' });
      }

      const [updatedCharacter] = await db
        .update(characters)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(characters.id, id))
        .returning();

      return res.status(200).json(updatedCharacter);
    }

    if (req.method === 'DELETE') {
      const session = await requireAdmin(req, res);
      if (!session) return;

      await db.delete(characters).where(eq(characters.id, id));
      return res.status(200).json({ message: 'Character deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Character management error:', error);
    return res.status(500).json({ 
      message: 'Failed to process character request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}