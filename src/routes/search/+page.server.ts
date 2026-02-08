/**
 * Search page server load — fetches listings based on URL query params.
 * SSR with URL-driven search for SEO and shareability.
 */

import type { PageServerLoad } from "./$types";
import { db } from "$db/connection";
import { searchListings } from "$services/listing-service";
import { listingSearchSchema, searchParamsToObject } from "$lib/server/api/schemas";
import type { ListingSearchParams } from "$types/api";

export const load: PageServerLoad = async ({ url }) => {
    const raw = searchParamsToObject(url.searchParams);
    const parsed = listingSearchSchema.safeParse(raw);

    if (!parsed.success) {
        // Invalid params — return empty results with the raw query for display
        return {
            listings: { data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } },
            query: raw,
        };
    }

    const result = await searchListings(db, parsed.data as ListingSearchParams);

    return {
        listings: result,
        query: raw,
    };
};
