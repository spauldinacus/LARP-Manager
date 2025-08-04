
import { clearSession } from '../../lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await clearSession(res);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      message: 'Failed to process logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
