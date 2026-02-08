/**
 * GET /api/v1/listings/nearby — Geospatial proximity search.
 *
 * Query params: lat, lng, radiusKm (optional, default 5),
 *               propertyType, listingType, page, limit
 *
 * Uses PostGIS ST_DWithin for efficient radius search.
 * Returns: PaginatedResponse<ListingSummary & { distanceKm }>
 */

import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$db/connection";
import { searchNearby } from "$services/listing-service";
import { nearbySearchSchema, searchParamsToObject } from "$lib/server/api/schemas";
import { jsonOk, zodErrorResponse } from "$lib/server/api/response";

export const GET: RequestHandler = async ({ url }) => {
    const raw = searchParamsToObject(url.searchParams);
    const parsed = nearbySearchSchema.safeParse(raw);

    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const result = await searchNearby(db, parsed.data);
    return jsonOk(result);
};
