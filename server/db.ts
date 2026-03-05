import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.CUSTOM_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
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
