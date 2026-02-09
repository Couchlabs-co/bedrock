/**
 * Custom PostgreSQL column types for Drizzle ORM.
 * Handles tsvector and inet types that don't have built-in Drizzle support.
 */

import { customType } from "drizzle-orm/pg-core";

/**
 * PostgreSQL tsvector column type.
 * Used for full-text search on listings.
 */
export const tsvector = customType<{ data: string }>({
    dataType() {
        return "tsvector";
    },
});

/**
 * PostgreSQL inet column type.
 * Stores IP addresses for sessions and audit logs.
 */
export const inet = customType<{ data: string | null }>({
    dataType() {
        return "inet";
    },
});
