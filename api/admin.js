
// Combined admin endpoints for Vercel
import { db, users, characters, heritages, archetypes, skills } from '../lib/db.js';
import { requireAdmin } from '../lib/session.js';
import { eq, count, desc } from 'drizzle-orm';

export default async function handler(req, res) {
  const { method } = req;
  const pathParts = req.url?.split('/').filter(Boolean) || [];
  const resource = pathParts[1]; // admin/[resource]

  try {
    // Require admin for all admin endpoints
    const session = await requireAdmin(req, res);
    if (!session) return;

    switch (resource) {
      case 'users':
        return await handleUsers(req, res, method);
      case 'stats':
        return await handleStats(req, res, method);
      case 'heritages':
        return await handleHeritages(req, res, method);
      case 'archetypes':
        return await handleArchetypes(req, res, method);
      case 'skills':
        return await handleSkills(req, res, method);
      default:
        return res.status(404).json({ message: 'Admin resource not found' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ 
      message: 'Failed to process admin request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

async function handleHeritages(req, res, method) {
  if (method === 'GET') {
    const allHeritages = await db.select().from(heritages);
    return res.status(200).json(allHeritages);
  }
  
  if (method === 'POST') {
    const [newHeritage] = await db.insert(heritages).values(req.body).returning();
    return res.status(201).json(newHeritage);
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleArchetypes(req, res, method) {
  if (method === 'GET') {
    const allArchetypes = await db.select().from(archetypes);
    return res.status(200).json(allArchetypes);
  }
  
  if (method === 'POST') {
    const [newArchetype] = await db.insert(archetypes).values(req.body).returning();
    return res.status(201).json(newArchetype);
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleSkills(req, res, method) {
  if (method === 'GET') {
    const allSkills = await db.select().from(skills);
    return res.status(200).json(allSkills);
  }
  
  if (method === 'POST') {
    const [newSkill] = await db.insert(skills).values(req.body).returning();
    return res.status(201).json(newSkill);
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}
