// Combined characters endpoints for Vercel
import { db, characters, experienceEntries, users, heritages, cultures, archetypes } from '../lib/db.js';
import { getSessionData, requireAuth, requireAdmin } from '../lib/session.js';
import { eq, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export default async function handler(req, res) {
  const { method } = req;
  const pathParts = req.url?.split('/').filter(Boolean) || [];
  const characterId = pathParts[1]; // characters/[id]
  const action = pathParts[2]; // characters/[id]/[action]

  try {
    // Handle character list operations
    if (!characterId) {
      return await handleCharactersList(req, res, method);
    }

    // Handle individual character operations
    if (!action) {
      return await handleSingleCharacter(req, res, method, characterId);
    }

    // Handle character sub-resources
    switch (action) {
      case 'experience':
        return await handleCharacterExperience(req, res, method, characterId);
      case 'attendance-xp':
        return await handleAttendanceXp(req, res, method, characterId);
      default:
        return res.status(404).json({ message: 'Character endpoint not found' });
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
    if (!session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    
    const secondaryArchetypes = alias(archetypes, 'secondaryArchetypes');

    const allCharacters = await db
      .select({
        id: characters.id,
        name: characters.name,
        user_id: characters.user_id,
        heritage_id: characters.heritage_id,
        culture_id: characters.culture_id,
        archetype_id: characters.archetype_id,
        secondary_archetype_id: characters.secondary_archetype_id,
        body: characters.body,
        mind: characters.mind,
        spirit: characters.spirit,
        purchasedSkills: characters.purchasedSkills,
        totalXpSpent: characters.totalXpSpent,
        experience: characters.experience,
        isActive: characters.isActive,
        created_at: characters.created_at,
        updated_at: characters.updated_at,
        playerName: users.playerName,
        email: users.email,
        heritageName: heritages.name,
        cultureName: cultures.name,
        archetypeName: archetypes.name,
        secondaryArchetypeName: secondaryArchetypes.name,
      })
      .from(characters)
      .leftJoin(users, eq(characters.user_id, users.id))
      .leftJoin(heritages, eq(characters.heritage_id, heritages.id))
      .leftJoin(cultures, eq(characters.culture_id, cultures.id))
      .leftJoin(archetypes, eq(characters.archetype_id, archetypes.id))
      .leftJoin(secondaryArchetypes, eq(characters.secondary_archetype_id, secondaryArchetypes.id));
    return res.status(200).json(allCharacters);
  }

  if (method === 'POST') {
    const session = await requireAuth(req, res);
    if (!session) return;

    const [newCharacter] = await db.insert(characters)
      .values({ ...req.body, user_id: session.user_id })
      .returning();

    return res.status(201).json(newCharacter);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleSingleCharacter(req, res, method, characterId) {
  if (method === 'GET') {
    const session = await requireAuth(req, res);
    if (!session) return;

    
    const secondaryArchetypes = alias(archetypes, 'secondaryArchetypes');

    const [character] = await db
      .select({
        id: characters.id,
        name: characters.name,
        user_id: characters.user_id,
        heritage_id: characters.heritage_id,
        culture_id: characters.culture_id,
        archetype_id: characters.archetype_id,
        secondary_archetype_id: characters.secondary_archetype_id,
        body: characters.body,
        mind: characters.mind,
        spirit: characters.spirit,
        purchasedSkills: characters.purchasedSkills,
        totalXpSpent: characters.totalXpSpent,
        experience: characters.experience,
        isActive: characters.isActive,
        created_at: characters.created_at,
        updated_at: characters.updated_at,
        playerName: users.playerName,
        email: users.email,
        heritageName: heritages.name,
        cultureName: cultures.name,
        archetypeName: archetypes.name,
        secondaryArchetypeName: secondaryArchetypes.name,
      })
      .from(characters)
      .leftJoin(users, eq(characters.user_id, users.id))
      .leftJoin(heritages, eq(characters.heritage_id, heritages.id))
      .leftJoin(cultures, eq(characters.culture_id, cultures.id))
      .leftJoin(archetypes, eq(characters.archetype_id, archetypes.id))
      .leftJoin(secondaryArchetypes, eq(characters.secondary_archetype_id, secondaryArchetypes.id))
      .where(eq(characters.id, characterId));

    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }

    return res.status(200).json(character);
  }

  if (method === 'PUT') {
    const session = await requireAuth(req, res);
    if (!session) return;

    const [updatedCharacter] = await db
      .update(characters)
      .set(req.body)
      .where(eq(characters.id, characterId))
      .returning();

    return res.status(200).json(updatedCharacter);
  }

  if (method === 'DELETE') {
    const session = await requireAdmin(req, res);
    if (!session) return;

    await db.delete(characters).where(eq(characters.id, characterId));
    return res.status(200).json({ message: 'Character deleted successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
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

    return res.status(200).json(experience);
  }

  if (method === 'POST') {
    const session = await requireAdmin(req, res);
    if (!session) return;

    const [newEntry] = await db.insert(experienceEntries)
      .values({
        ...req.body,
        character_id: characterId,
        awarded_by: session.user_id
      })
      .returning();

    return res.status(201).json(newEntry);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleAttendanceXp(req, res, method, characterId) {
  if (method === 'POST') {
    const session = await requireAdmin(req, res);
    if (!session) return;

    const [newEntry] = await db.insert(experienceEntries)
      .values({
        character_id: characterId,
        amount: req.body.amount,
        reason: `Attendance XP: ${req.body.eventName}`,
        event_id: req.body.eventId,
        awarded_by: session.user_id
      })
      .returning();

    return res.status(201).json(newEntry);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}