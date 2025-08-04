
import { setSessionData } from '../../lib/session.js';
import { hashPassword, getUserByEmail, createUser } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { playerName, email, password, chapterId } = req.body;

    if (!playerName || !email || !password) {
      return res.status(400).json({ message: 'Player name, email, and password are required' });
    }

    // Check if user exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const newUser = await createUser({
      playerName,
      email,
      password: hashedPassword,
      chapterId: chapterId || null,
      isAdmin: false,
      role: 'player',
      candles: 0
    });

    // Create session
    const sessionData = {
      userId: newUser.id,
      isAdmin: newUser.isAdmin,
      role: newUser.role
    };
    
    await setSessionData(res, sessionData);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ 
      message: 'Failed to process registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
