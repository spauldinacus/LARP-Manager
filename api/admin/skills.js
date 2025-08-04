
// Skills management endpoint for Vercel
import { db, skillsTable } from '../../lib/db.js';
import { requireAdmin } from '../../lib/session.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const session = await requireAdmin(req, res);
      if (!session) return;

      const skills = await db.select().from(skillsTable).orderBy(skillsTable.name);
      return res.status(200).json(skills);
    }

    if (req.method === 'POST') {
      const session = await requireAdmin(req, res);
      if (!session) return;

      const [newSkill] = await db.insert(skillsTable)
        .values(req.body)
        .returning();

      return res.status(201).json(newSkill);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Skills API error:', error);
    return res.status(500).json({ 
      message: 'Failed to process skills request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
