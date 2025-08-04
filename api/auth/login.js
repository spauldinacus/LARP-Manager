
import { db, users } from '../../lib/db.js';
import { eq } from 'drizzle-orm';
import { setSessionData } from '../../lib/session.js';
import { comparePassword, getUserByEmail } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create session
    const sessionData = {
      userId: user.id,
      isAdmin: user.isAdmin,
      role: user.role
    };
    
    await setSessionData(res, sessionData);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Failed to process login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
