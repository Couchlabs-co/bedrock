/**
 * Database connection via Drizzle ORM + postgres.js.
 * Provides a type-safe query interface with full relational query support.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgres://location:location@localhost:5432/location";

/** postgres.js client — underlying connection used by Drizzle */
const client = postgres(connectionString);

/** Drizzle ORM instance with full schema for type-safe relational queries */
export const db = drizzle(client, { schema });

/** Type of the Drizzle database instance */
export type Database = typeof db;
