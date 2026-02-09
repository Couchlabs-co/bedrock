/**
 * Database setup script — enables required PostgreSQL extensions.
 * Run with: bun run src/lib/server/db/setup-extensions.ts
 */

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL ?? "postgres://location:location@localhost:5432/location";

const sql = postgres(connectionString);

async function setup(): Promise<void> {
    try {
        console.log("Enabling pg_trgm extension...");
        await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public`;
        console.log("✓ pg_trgm enabled");

        console.log("Enabling pgcrypto extension...");
        await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public`;
        console.log("✓ pgcrypto enabled");
    } catch (error) {
        console.error("Extension setup error:", error);
        throw error;
    } finally {
        await sql.end();
        console.log("\nDone.");
    }
}

setup().catch((err) => {
    console.error("Setup failed:", err);
    process.exit(1);
});
