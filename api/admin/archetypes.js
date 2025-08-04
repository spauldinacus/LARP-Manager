
// Archetypes management endpoint for Vercel
import { db, archetypesTable } from '../../lib/db.js';
import { requireAdmin } from '../../lib/session.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const session = await requireAdmin(req, res);
      if (!session) return;

      const archetypes = await db.select().from(archetypesTable).orderBy(archetypesTable.name);
      return res.status(200).json(archetypes);
    }

    if (req.method === 'POST') {
      const session = await requireAdmin(req, res);
      if (!session) return;

      const [newArchetype] = await db.insert(archetypesTable)
        .values(req.body)
        .returning();

      return res.status(201).json(newArchetype);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Archetypes API error:', error);
    return res.status(500).json({ 
      message: 'Failed to process archetypes request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
