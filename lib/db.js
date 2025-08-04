
// Database connection for Vercel serverless functions
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Import schema
import * as schema from '../shared/schema.js';

// Configure neon for serverless
const sql = neon(process.env.DATABASE_URL, {
  fetchConnectionCache: true,
});

export const db = drizzle(sql, { schema });

// Re-export schema for convenience  
export * from '../shared/schema.js';
