// Chapters API endpoint for Vercel
import { db, chapters, users } from '../lib/db.js';
import { eq, count } from 'drizzle-orm';

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
          created_at: chapters.created_at,
          updated_at: chapters.updated_at,
          memberCount: count(users.id),
        })
        .from(chapters)
        .leftJoin(users, eq(chapters.id, users.chapter_id))
        .groupBy(chapters.id, chapters.name, chapters.code, chapters.description, chapters.isActive, chapters.created_at, chapters.updated_at)
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