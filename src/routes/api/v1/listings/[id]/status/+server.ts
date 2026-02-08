/**
 * PATCH /api/v1/listings/:id/status — Change listing status (agent/admin).
 *
 * Body: { status, soldPrice?, soldDate?, soldType? }
 *
 * Valid transitions:
 *   current   → withdrawn | offmarket | sold | leased | deleted
 *   withdrawn → current   | deleted
 *   offmarket → current   | deleted
 *   sold      → deleted
 *   leased    → deleted
 */

import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$db/connection";
import { changeListingStatus, resolveAgencyId } from "$services/agent-listing-service";
import { uuidParamSchema, statusChangeSchema } from "$lib/server/api/schemas";
import { jsonOk, apiError, zodErrorResponse } from "$lib/server/api/response";
import { requireAgent } from "$lib/server/api/guards";
import type { StatusChangeInput } from "$services/agent-listing-service";
import { z } from "zod";

export const PATCH: RequestHandler = async (event) => {
    const user = requireAgent(event);

    const paramsParsed = z.object({ id: uuidParamSchema }).safeParse(event.params);
    if (!paramsParsed.success) {
        return zodErrorResponse(paramsParsed.error);
    }

    const body = await event.request.json();
    const parsed = statusChangeSchema.safeParse(body);
    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const agencyId = await resolveAgencyId(db, user.id);
    if (!agencyId) {
        apiError(403, "No agency linked to your account", "NO_AGENCY");
    }

    const result = await changeListingStatus(db, paramsParsed.data.id, agencyId, parsed.data as StatusChangeInput);

    if (!result) {
        apiError(404, "Listing not found or not owned by your agency", "NOT_FOUND");
    }

    return jsonOk(result);
};
