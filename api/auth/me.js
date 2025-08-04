// Current user endpoint for Vercel
import { getSessionData } from '../lib/session.js';
import { getUserById } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSessionData(req);
    if (!session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get fresh user data from database
    const user = await getUserById(session.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    return res.status(200).json({ 
      user: { 
        id: user.id, 
        playerName: user.playerName, 
        email: user.email, 
        isAdmin: user.isAdmin, 
        roleId: user.roleId, 
        candles: user.candles || 0, 
        playerNumber: user.playerNumber, 
        chapterId: user.chapterId,
        title: user.title 
      } 
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ 
      message: 'Failed to get user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}