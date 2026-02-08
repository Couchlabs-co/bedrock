/**
 * GET    /api/v1/listings/:id — Full listing detail (public).
 * PUT    /api/v1/listings/:id — Update listing (agent/admin).
 * DELETE /api/v1/listings/:id — Soft-delete listing (agent/admin).
 */

import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$db/connection";
import { getListingById } from "$services/listing-service";
import { updateListing, softDeleteListing, resolveAgencyId } from "$services/agent-listing-service";
import { uuidParamSchema, createListingSchema } from "$lib/server/api/schemas";
import { jsonOk, apiError, zodErrorResponse } from "$lib/server/api/response";
import { requireAgent } from "$lib/server/api/guards";
import type { CreateListingInput } from "$services/agent-listing-service";
import { z } from "zod";

const idSchema = z.object({ id: uuidParamSchema });

export const GET: RequestHandler = async ({ params }) => {
    const parsed = idSchema.safeParse(params);

    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const listing = await getListingById(db, parsed.data.id);

    if (!listing) {
        apiError(404, "Listing not found", "NOT_FOUND");
    }

    return jsonOk(listing);
};

export const PUT: RequestHandler = async (event) => {
    const user = requireAgent(event);

    const paramsParsed = idSchema.safeParse(event.params);
    if (!paramsParsed.success) {
        return zodErrorResponse(paramsParsed.error);
    }

    const body = await event.request.json();
    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const agencyId = await resolveAgencyId(db, user.id);
    if (!agencyId) {
        apiError(403, "No agency linked to your account", "NO_AGENCY");
    }

    const result = await updateListing(db, paramsParsed.data.id, agencyId, parsed.data as CreateListingInput);

    if (!result) {
        apiError(404, "Listing not found or not owned by your agency", "NOT_FOUND");
    }

    return jsonOk(result);
};

export const DELETE: RequestHandler = async (event) => {
    const user = requireAgent(event);

    const paramsParsed = idSchema.safeParse(event.params);
    if (!paramsParsed.success) {
        return zodErrorResponse(paramsParsed.error);
    }

    const agencyId = await resolveAgencyId(db, user.id);
    if (!agencyId) {
        apiError(403, "No agency linked to your account", "NO_AGENCY");
    }

    const result = await softDeleteListing(db, paramsParsed.data.id, agencyId);

    if (!result) {
        apiError(404, "Listing not found or not owned by your agency", "NOT_FOUND");
    }

    return jsonOk({ deleted: true });
};
