// Combined characters endpoints for Vercel
import { db, characters, experienceEntries, users, heritages, cultures, archetypes } from '../lib/db.js';
import { getSessionData, requireAuth, requireAdmin } from '../lib/session.js';
import { eq, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export default async function handler(req, res) {
  // Ensure req.body is parsed for POST, PUT, PATCH requests (Vercel/Node.js serverless)
  const method = req.method || req?.method;
  if ((method === "POST" || method === "PUT" || method === "PATCH") && typeof req.body === "undefined") {
    try {
      req.body = JSON.parse(await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => (data += chunk));
        req.on("end", () => resolve(data || "{}"));
        req.on("error", reject);
      }));
    } catch {
      req.body = {};
    }
  }

  const pathParts = req.url?.split('/').filter(Boolean) || [];
  // Expecting: ["api", "characters", "<id>", "<action>"]
  const characterId = pathParts[2]; // api/characters/[id]
  const action = pathParts[3];      // api/characters/[id]/[action]

  try {
    // Handle character list operations
    if (!characterId) {
      await handleCharactersList(req, res, method);
      return;
    }

    // Handle individual character operations
    if (!action) {
      await handleSingleCharacter(req, res, method, characterId);
      return;
    }

    // Handle character sub-resources
    switch (action) {
      case 'experience':
        await handleCharacterExperience(req, res, method, characterId);
        return;
      case 'attendance-xp':
        await handleAttendanceXp(req, res, method, characterId);
        return;
      case 'achievements':
        await handleCharacterAchievements(req, res, method, characterId);
        return;
      default:
        res.status(404).json({ message: 'Character endpoint not found' });
        return;
    }
// Handler for character achievements (stub, returns empty array for GET)
async function handleCharacterAchievements(req, res, method, characterId) {
  if (method === 'GET') {
    // TODO: Implement actual achievement lookup if needed
    res.status(200).json([]); return;
  }
  res.status(405).json({ message: 'Method not allowed' }); return;
}
  } catch (error) {
    console.error('Characters API error:', error);
    return res.status(500).json({
      message: 'Failed to process characters request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleCharactersList(req, res, method) {
  if (method === 'GET') {
    const session = await getSessionData(req);
    console.log('Session debug:', session);
    if (!session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    
    let allCharacters = [];
    try {
      allCharacters = await db
        .select({
          id: characters.id,
          name: characters.name,
          user_id: characters.user_id,
          heritage: characters.heritage,
          culture: characters.culture,
          archetype: characters.archetype,
          experience: characters.experience,
          user_candles: users.candles,
          created_at: characters.created_at,
          updated_at: characters.updated_at,
          player_name: users.player_name,
          email: users.email,
          heritage_name: heritages.name,
          culture_name: cultures.name,
          archetype_name: archetypes.name,
        })
        .from(characters)
        .leftJoin(users, eq(characters.user_id, users.id))
        .leftJoin(heritages, eq(characters.heritage, heritages.id))
        .leftJoin(cultures, eq(characters.culture, cultures.id))
        .leftJoin(archetypes, eq(characters.archetype, archetypes.id));
    } catch (err) {
      console.error('Characters API select error:', err);
      res.status(500).json({ message: 'Failed to load characters', error: err.message });
      return;
    }
    if (!allCharacters) {
      res.status(200).json([]);
      return;
    }
    res.status(200).json(allCharacters);
    return;
  }

  if (method === 'POST') {
    const session = await requireAuth(req, res);
    if (!session) return;

    const [newCharacter] = await db.insert(characters)
      .values({ ...req.body, user: session.user })
      .returning();

    return res.status(201).json(newCharacter);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleSingleCharacter(req, res, method, characterId) {
  if (method === 'GET') {
    const session = await requireAuth(req, res);
    if (!session) return;

    
    let character;
    try {
      [character] = await db
        .select({
          id: characters.id,
          name: characters.name,
          user_id: characters.user_id,
          heritage: characters.heritage,
          culture: characters.culture,
          archetype: characters.archetype,
          experience: characters.experience,
          user_candles: users.candles,
          created_at: characters.created_at,
          updated_at: characters.updated_at,
          player_name: users.player_name,
          email: users.email,
          heritage_name: heritages.name,
          culture_name: cultures.name,
          archetype_name: archetypes.name,
        })
        .from(characters)
        .leftJoin(users, eq(characters.user_id, users.id))
        .leftJoin(heritages, eq(characters.heritage, heritages.id))
        .leftJoin(cultures, eq(characters.culture, cultures.id))
        .leftJoin(archetypes, eq(characters.archetype, archetypes.id))
        .where(eq(characters.id, characterId));
    } catch (err) {
      console.error('Single Character API select error:', err);
      res.status(500).json({ message: 'Failed to load character', error: err.message });
      return;
    }
    if (!character) {
      res.status(404).json({ message: 'Character not found' });
      return;
    }
    res.status(200).json(character);
    return;
  }

  if (method === 'PUT') {
    const session = await requireAuth(req, res);
    if (!session) return;

    const [updatedCharacter] = await db
      .update(characters)
      .set(req.body)
      .where(eq(characters.id, characterId))
      .returning();

    res.status(200).json(updatedCharacter);
    return;
  }

  if (method === 'DELETE') {
    const session = await requireAdmin(req, res);
    if (!session) return;

    await db.delete(characters).where(eq(characters.id, characterId));
    res.status(200).json({ message: 'Character deleted successfully' });
    return;
  }

    res.status(405).json({ message: 'Method not allowed' });
    return;
}

async function handleCharacterExperience(req, res, method, characterId) {
  if (method === 'GET') {
    const session = await requireAuth(req, res);
    if (!session) return;

    const experience = await db
      .select()
      .from(experienceEntries)
      .where(eq(experienceEntries.character_id, characterId))
      .orderBy(desc(experienceEntries.created_at));

    if (!experience) {
      res.status(200).json([]);
      return;
    }
    res.status(200).json(experience);
    return;
  }

  if (method === 'POST') {
    const session = await requireAdmin(req, res);
    if (!session) return;

    const [newEntry] = await db.insert(experienceEntries)
      .values({
        ...req.body,
        character_id: characterId,
        awarded_by: session.user
      })
      .returning();

    res.status(201).json(newEntry);
    return;
  }

    res.status(405).json({ message: 'Method not allowed' });
    return;
}

async function handleAttendanceXp(req, res, method, characterId) {
  if (method === 'GET') {
    // Optionally, return a stub or real data if you want to support GET
    res.status(200).json([]); return;
  }
  if (method === 'POST') {
    const session = await requireAdmin(req, res);
    if (!session) return;

    const [newEntry] = await db.insert(experienceEntries)
      .values({
        character_id: characterId,
        amount: req.body.amount,
        reason: `Attendance XP: ${req.body.eventName}`,
        eventId: req.body.event.id,
        awarded_by: session.user
      })
      .returning();

    res.status(201).json(newEntry); return;
  }
  res.status(405).json({ message: 'Method not allowed' }); return;
}