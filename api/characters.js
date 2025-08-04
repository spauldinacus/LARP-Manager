// Characters API endpoint for Vercel
import { db, characters, users, heritagesTable, culturesTable, archetypesTable } from '../lib/db.js';
import { getSessionData } from '../lib/session.js';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all characters with player information
      const charactersWithPlayers = await db
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
        .orderBy(desc(characters.createdAt));

      return res.status(200).json(charactersWithPlayers);
    }

    if (req.method === 'POST') {
      // Create new character - require authentication
      const session = await getSessionData(req);
      if (!session) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const characterData = {
        ...req.body,
        userId: session.userId, // Ensure character belongs to authenticated user
      };

      const [newCharacter] = await db.insert(characters)
        .values(characterData)
        .returning();

      return res.status(201).json(newCharacter);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Characters API error:', error);
    return res.status(500).json({ 
      message: 'Failed to process characters request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}