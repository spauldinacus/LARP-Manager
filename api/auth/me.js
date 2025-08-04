
import { db, users } from '../../lib/db.js';
import { eq } from 'drizzle-orm';
import { getSessionData } from '../../lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSessionData(req);
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await db.select().from(users).where(eq(users.id, session.userId));
    if (!user || user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user[0];
    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ 
      message: 'Failed to get user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
