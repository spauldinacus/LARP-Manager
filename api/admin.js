// Combined admin endpoints for Vercel
import { db, users, characters, heritages, archetypes, skills, cultures } from '../lib/db.js';
import { requireAdmin } from '../lib/session.js';
import { eq, count, desc } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    const session = await requireAdmin(req, res);
    if (!session) return;

    const { method } = req;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    // Handle query parameter based routing
    if (type === 'stats') {
      return await handleStats(req, res, method);
    } else if (type === 'skills') {
      return await handleSkills(req, res, method, id);
    } else if (type === 'heritages') {
      return await handleHeritages(req, res, method, id);
    } else if (type === 'cultures') {
      return await handleCultures(req, res, method, id);
    } else if (type === 'archetypes') {
      return await handleArchetypes(req, res, method, id);
    }

    // Legacy path-based routing for backward compatibility
    const path = req.url?.split('?')[0] || '';
    if (path.includes('/stats')) {
      return await handleStats(req, res, method);
    }

    return res.status(404).json({ message: 'Admin endpoint not found' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

async function handleUsers(req, res, method) {
  if (method === 'GET') {
    const allUsers = await db.select().from(users);
    const usersWithoutPasswords = allUsers.map(({ password: _, ...user }) => user);
    return res.status(200).json(usersWithoutPasswords);
  }

  if (method === 'POST') {
    const [newUser] = await db.insert(users).values(req.body).returning();
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json(userWithoutPassword);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleStats(req, res, method) {
  if (method === 'GET') {
    const [totalCharacters] = await db.select({ count: count() }).from(characters);
    const [totalUsers] = await db.select({ count: count() }).from(users);

    return res.status(200).json({
      totalCharacters: totalCharacters.count.toString(),
      totalUsers: totalUsers.count.toString(),
      totalCharactersLastMonth: "0", // Add proper calculation if needed
      totalUsersLastMonth: "0"
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleHeritages(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [heritage] = await db.select().from(heritages).where(eq(heritages.id, id));
      return res.status(200).json(heritage);
    }
    const allHeritages = await db.select().from(heritages);
    return res.status(200).json(allHeritages);
  }

  if (method === 'POST') {
    const [newHeritage] = await db.insert(heritages).values(req.body).returning();
    return res.status(201).json(newHeritage);
  }

  if (method === 'PUT' && id) {
    const [updatedHeritage] = await db.update(heritages).set(req.body).where(eq(heritages.id, id)).returning();
    return res.status(200).json(updatedHeritage);
  }

  if (method === 'DELETE' && id) {
    await db.delete(heritages).where(eq(heritages.id, id));
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleArchetypes(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [archetype] = await db.select().from(archetypes).where(eq(archetypes.id, id));
      return res.status(200).json(archetype);
    }
    const allArchetypes = await db.select().from(archetypes);
    return res.status(200).json(allArchetypes);
  }

  if (method === 'POST') {
    const [newArchetype] = await db.insert(archetypes).values(req.body).returning();
    return res.status(201).json(newArchetype);
  }

  if (method === 'PUT' && id) {
    const [updatedArchetype] = await db.update(archetypes).set(req.body).where(eq(archetypes.id, id)).returning();
    return res.status(200).json(updatedArchetype);
  }

  if (method === 'DELETE' && id) {
    await db.delete(archetypes).where(eq(archetypes.id, id));
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleSkills(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [skill] = await db.select().from(skills).where(eq(skills.id, id));
      return res.status(200).json(skill);
    }
    const allSkills = await db.select().from(skills);
    return res.status(200).json(allSkills);
  }

  if (method === 'POST') {
    const [newSkill] = await db.insert(skills).values(req.body).returning();
    return res.status(201).json(newSkill);
  }

  if (method === 'PUT' && id) {
    const [updatedSkill] = await db.update(skills).set(req.body).where(eq(skills.id, id)).returning();
    return res.status(200).json(updatedSkill);
  }

  if (method === 'DELETE' && id) {
    await db.delete(skills).where(eq(skills.id, id));
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleCultures(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [culture] = await db.select().from(cultures).where(eq(cultures.id, id));
      return res.status(200).json(culture);
    }
    const allCultures = await db.select().from(cultures);
    return res.status(200).json(allCultures);
  }

  if (method === 'POST') {
    const [newCulture] = await db.insert(cultures).values(req.body).returning();
    return res.status(201).json(newCulture);
  }

  if (method === 'PUT' && id) {
    const [updatedCulture] = await db.update(cultures).set(req.body).where(eq(cultures.id, id)).returning();
    return res.status(200).json(updatedCulture);
  }

  if (method === 'DELETE' && id) {
    await db.delete(cultures).where(eq(cultures.id, id));
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Method not allowed' });
}