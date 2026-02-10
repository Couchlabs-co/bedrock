/**
 * Listings Search API Endpoint
 * GET /api/v1/listings/search
 *
 * Search and filter listings based on various criteria:
 * - Location (suburb, postcode, state)
 * - Property type (residential, commercial, land, etc.)
 * - Listing type (sale, rent, lease)
 * - Price range (priceMin, priceMax)
 * - Features (bedsMin, bathsMin, carsMin)
 * - Full-text search (q)
 * - Sorting and pagination
 *
 * Returns paginated listing summaries with metadata.
 */

import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { db } from "$db/connection";
import { searchListings } from "$services/listing-service";
import { listingSearchSchema, searchParamsToObject } from "$lib/server/api/schemas";
import type { ListingSearchParams } from "$types/api";

export async function GET({ url }: RequestEvent) {
    try {
        // Parse and validate query parameters
        const raw = searchParamsToObject(url.searchParams);
        const parsed = listingSearchSchema.safeParse(raw);

        if (!parsed.success) {
            return json(
                {
                    error: "Invalid search parameters",
                    details: parsed.error.format(),
                },
                { status: 400 },
            );
        }

        // Execute search
        const result = await searchListings(db, parsed.data as ListingSearchParams);

        return json(result, { status: 200 });
    } catch (error) {
        console.error("Search API error:", error);
        return json(
            {
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
