
// Login endpoint for Vercel
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sealData } from 'iron-session';
import { users } from '../../shared/schema.js';

// Database setup (inline to avoid import issues)
const sql = neon(process.env.DATABASE_URL, {
  fetchConnectionCache: true,
});
const db = drizzle(sql, { schema: { users } });

// Session options (inline to avoid import issues)
const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_change_in_production',
  cookieName: 'thrune_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    path: '/',
  },
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Get user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create session
    const sessionData = {
      userId: user.id,
      isAdmin: user.isAdmin,
      role: user.role
    };
    
    // Seal and set session cookie
    const sealed = await sealData(sessionData, {
      password: sessionOptions.password,
    });

    const cookieValue = `${sessionOptions.cookieName}=${sealed}; HttpOnly; Path=/; Max-Age=${sessionOptions.cookieOptions.maxAge}; SameSite=${sessionOptions.cookieOptions.sameSite}${sessionOptions.cookieOptions.secure ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookieValue);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
