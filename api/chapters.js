// Chapters API endpoint for Vercel
import { db, chapters, users } from '../lib/db.js';
import { eq, count } from 'drizzle-orm';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all chapters with member counts
      const chaptersWithCounts = await db
        .select({
          id: chapters.id,
          name: chapters.name,
          code: chapters.code,
          description: chapters.description,
          isActive: chapters.isActive,
          createdAt: chapters.createdAt,
          updatedAt: chapters.updatedAt,
          memberCount: count(users.id),
        })
        .from(chapters)
        .leftJoin(users, eq(chapters.id, users.chapterId))
        .groupBy(chapters.id, chapters.name, chapters.code, chapters.description, chapters.isActive, chapters.createdAt, chapters.updatedAt)
        .orderBy(chapters.name);

      return res.status(200).json(chaptersWithCounts);
    }

    if (req.method === 'POST') {
      // Create new chapter (admin only in full implementation)
      const chapterData = req.body;
      
      const [newChapter] = await db.insert(chapters)
        .values(chapterData)
        .returning();
      
      return res.status(201).json(newChapter);
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Chapters API error:', error);
    return res.status(500).json({ 
      message: 'Failed to process chapters request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}