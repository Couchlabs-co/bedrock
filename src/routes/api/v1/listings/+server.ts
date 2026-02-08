/**
 * GET /api/v1/listings — Search and filter listings.
 *
 * Query params: q, suburb, postcode, state, propertyType, listingType,
 *               priceMin, priceMax, bedsMin, bathsMin, carsMin,
 *               sort, order, page, limit
 *
 * Returns: PaginatedResponse<ListingSummary>
 */

import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$db/connection";
import { searchListings } from "$services/listing-service";
import { listingSearchSchema, searchParamsToObject } from "$lib/server/api/schemas";
import { jsonOk, zodErrorResponse } from "$lib/server/api/response";
import type { ListingSearchParams } from "$types/api";

export const GET: RequestHandler = async ({ url }) => {
    const raw = searchParamsToObject(url.searchParams);
    const parsed = listingSearchSchema.safeParse(raw);

    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const result = await searchListings(db, parsed.data as ListingSearchParams);
    return jsonOk(result);
};
