import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;

export type DatabaseConnection = NeonDatabase<typeof schema>;

export const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : null;

if (!databaseUrl) {
  console.warn(
    "DATABASE_URL is not set. Falling back to in-memory storage. All data will be reset on restart.",
  );
}

if (pool) {
  // Add error handling for pool connections
  pool.on("error", (err) => {
    console.error("Unexpected database pool error:", err);
    // Don't exit the process - let the application handle the error
  });

  pool.on("connect", () => {
    console.log("Database connection established");
  });
}

export const db: DatabaseConnection | null = pool
  ? drizzle({ client: pool, schema })
  : null;

export function hasDatabaseConnection(): boolean {
  return db !== null;
}
