
// Combined auth endpoints for Vercel
import { db, users } from '../../lib/db.js';
import { eq } from 'drizzle-orm';
import { getSessionData, setSessionData, clearSession } from '../../lib/session.js';
import { hashPassword, comparePassword, getUserByEmail, createUser } from '../../lib/auth.js';

export default async function handler(req, res) {
  const { method } = req;

  // Ensure req.body is parsed for POST requests (Vercel/Node.js serverless)
  if (method === "POST" && typeof req.body === "undefined") {
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

  // For Vercel, the URL path after /api/auth/ will be in req.url
  // Extract action from URL path or query parameter
  let action = req.query.action;

  if (!action && req.url) {
    // Remove leading slash and get the action
    const pathParts = req.url.split('/').filter(Boolean);
    action = pathParts[0]; // This should be the action (login, register, etc.)
  }

  try {
    switch (action) {
      case 'login':
        return await handleLogin(req, res, method);
      case 'register':
        return await handleRegister(req, res, method);
      case 'logout':
        return await handleLogout(req, res, method);
      case 'me':
        return await handleMe(req, res, method);
      default:
        // If no action specified, default based on method
        if (method === 'POST') {
          return await handleLogin(req, res, method);
        } else if (method === 'GET') {
          return await handleMe(req, res, method);
        }
        return res.status(404).json({ message: 'Auth endpoint not found' });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ 
      message: 'Failed to process auth request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleLogin(req, res, method) {
  if (method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
    user_id: user.id,
    isAdmin: user.isAdmin,
    role: user.role
  };
  
  await setSessionData(res, sessionData);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return res.status(200).json({ user: userWithoutPassword });
}

async function handleRegister(req, res, method) {
  if (method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { playerName, email, password, chapter_id } = req.body;

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
    chapter_id: chapter_id || null,
    isAdmin: false,
    role: 'player',
    candles: 0
  });

  // Create session
  const sessionData = {
    user_id: newUser.id,
    isAdmin: newUser.isAdmin,
    role: newUser.role
  };
  
  await setSessionData(res, sessionData);

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  return res.status(201).json({ user: userWithoutPassword });
}

async function handleLogout(req, res, method) {
  if (method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await clearSession(res);
  return res.status(200).json({ message: 'Logged out successfully' });
}

async function handleMe(req, res, method) {
  if (method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSessionData(req);
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const user = await db.select().from(users).where(eq(users.id, session.user_id));
  if (!user || user.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user[0];
  return res.status(200).json({ user: userWithoutPassword });
}
