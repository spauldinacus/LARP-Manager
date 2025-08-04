// Database connection for Vercel serverless functions
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Import schema
import * as schema from '../../shared/schema.js';

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Re-export schema for convenience
export * from '../../shared/schema.js';