import { neon } from '@neondatabase/serverless';

// Create a tagged-template SQL helper powered by @neondatabase/serverless.
// It reads the connection string from the DATABASE_URL environment variable.
export const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : (strings, ...values) => {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set.');
      }
      return neon(process.env.DATABASE_URL)(strings, ...values);
    };
