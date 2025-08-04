
// Individual character API endpoint for Vercel
import { db, characters, users, heritagesTable, culturesTable, archetypesTable } from '../../lib/db.js';
import { getSessionData } from '../../lib/session.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Character ID is required' });
    }

    if (req.method === 'GET') {
      // Get individual character with player information
      const [characterWithPlayer] = await db
        .select({
          id: characters.id,
          name: characters.name,
          userId: characters.userId,
          heritage: heritagesTable.name,
          culture: culturesTable.name,
          archetype: archetypesTable.name,
          secondArchetype: characters.secondArchetype,
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

      if (!characterWithPlayer) {
        return res.status(404).json({ message: 'Character not found' });
      }

      return res.status(200).json(characterWithPlayer);
    }

    if (req.method === 'PUT') {
      // Update character - require authentication
      const session = await getSessionData(req);
      if (!session) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const [updatedCharacter] = await db
        .update(characters)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(characters.id, id))
        .returning();

      if (!updatedCharacter) {
        return res.status(404).json({ message: 'Character not found' });
      }

      return res.status(200).json(updatedCharacter);
    }

    if (req.method === 'DELETE') {
      // Delete character - require authentication and admin privileges
      const session = await getSessionData(req);
      if (!session) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if user is admin or owns the character
      const [existingCharacter] = await db
        .select({ userId: characters.userId })
        .from(characters)
        .where(eq(characters.id, id));

      if (!existingCharacter) {
        return res.status(404).json({ message: 'Character not found' });
      }

      const user = await db
        .select({ isAdmin: users.isAdmin })
        .from(users)
        .where(eq(users.id, session.userId));

      if (!user[0]?.isAdmin && existingCharacter.userId !== session.userId) {
        return res.status(403).json({ message: 'Not authorized to delete this character' });
      }

      await db.delete(characters).where(eq(characters.id, id));

      return res.status(200).json({ message: 'Character deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Individual character API error:', error);
    return res.status(500).json({ 
      message: 'Failed to process character request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
