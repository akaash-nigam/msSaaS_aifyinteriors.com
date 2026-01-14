import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Please check your .env file."
  );
}

// Create connection pool with standard PostgreSQL driver
const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Export pool for session store
export { pool };

// Helper function to test database connection
export async function testDatabaseConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully at:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}
