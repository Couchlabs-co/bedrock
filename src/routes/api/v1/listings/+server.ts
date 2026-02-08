/**
 * GET  /api/v1/listings — Search and filter listings (public).
 * POST /api/v1/listings — Create a single listing (agent/admin).
 */

import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$db/connection";
import { searchListings } from "$services/listing-service";
import { createListing, resolveAgencyId } from "$services/agent-listing-service";
import { listingSearchSchema, createListingSchema, searchParamsToObject } from "$lib/server/api/schemas";
import { jsonOk, zodErrorResponse, apiError } from "$lib/server/api/response";
import { requireAgent } from "$lib/server/api/guards";
import type { ListingSearchParams } from "$types/api";
import type { CreateListingInput } from "$services/agent-listing-service";

export const GET: RequestHandler = async ({ url }) => {
    const raw = searchParamsToObject(url.searchParams);
    const parsed = listingSearchSchema.safeParse(raw);

    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const result = await searchListings(db, parsed.data as ListingSearchParams);
    return jsonOk(result);
};

export const POST: RequestHandler = async (event) => {
    const user = requireAgent(event);

    const body = await event.request.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const agencyId = await resolveAgencyId(db, user.id);
    if (!agencyId) {
        apiError(403, "No agency linked to your account", "NO_AGENCY");
    }

    const result = await createListing(db, agencyId, parsed.data as CreateListingInput);
    return jsonOk(result, 201);
};
