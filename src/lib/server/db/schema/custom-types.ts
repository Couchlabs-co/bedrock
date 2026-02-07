/**
 * Custom PostgreSQL column types for Drizzle ORM.
 * Handles PostGIS geography, tsvector, and inet types that
 * don't have built-in Drizzle support.
 */

import { customType } from "drizzle-orm/pg-core";

/**
 * PostGIS geography(POINT, 4326) column type.
 * Stores latitude/longitude coordinates for geospatial queries.
 * Values are stored as WKT strings internally.
 */
export const geographyPoint = customType<{ data: string | null }>({
    dataType() {
        return "geography(POINT, 4326)";
    },
});

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
