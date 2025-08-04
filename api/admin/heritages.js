
// Heritages management endpoint for Vercel
import { db, heritagesTable } from '../../lib/db.js';
import { requireAdmin } from '../../lib/session.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const session = await requireAdmin(req, res);
      if (!session) return;

      const heritages = await db.select().from(heritagesTable).orderBy(heritagesTable.name);
      return res.status(200).json(heritages);
    }

    if (req.method === 'POST') {
      const session = await requireAdmin(req, res);
      if (!session) return;

      const [newHeritage] = await db.insert(heritagesTable)
        .values(req.body)
        .returning();

      return res.status(201).json(newHeritage);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Heritages API error:', error);
    return res.status(500).json({ 
      message: 'Failed to process heritages request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
