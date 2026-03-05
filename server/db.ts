import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DB_URL must be set.");
}

export const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 10000,
  ssl: false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

export const db = drizzle({ client: pool, schema });
