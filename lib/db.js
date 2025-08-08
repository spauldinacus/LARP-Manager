export { candleTransactions } from '../shared/schema.js';
// Database connection for Vercel serverless functions
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Import schema
import * as schema from '../shared/schema.js';

// Log database URL for debugging (without exposing sensitive info)
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  throw new Error('DATABASE_URL is required');
} else {
  // Extract host and port info for debugging
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('🔗 Database connection info:');
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || 5432}`);
    console.log(`   Database: ${url.pathname.substring(1)}`);
  } catch (e) {
    console.error('❌ Invalid DATABASE_URL format');
  }
}

// Configure neon for serverless
const sql = neon(process.env.DATABASE_URL, {
  fetchConnectionCache: true,
});

export const db = drizzle(sql, { schema });

// Re-export all schema exports for convenience  
export * from '../shared/schema.js';
// Named exports for compatibility with API imports
import { experience_entries, custom_achievements, custom_milestones } from '../shared/schema.js';
export const experienceEntries = experience_entries;
export const customAchievements = custom_achievements;
export const customMilestones = custom_milestones;