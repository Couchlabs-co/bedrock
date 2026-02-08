/**
 * GET /api/v1/listings/:id — Full listing detail.
 *
 * Path param: id (UUID)
 *
 * Returns: ListingDetail or 404
 */

import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$db/connection";
import { getListingById } from "$services/listing-service";
import { uuidParamSchema } from "$lib/server/api/schemas";
import { jsonOk, apiError, zodErrorResponse } from "$lib/server/api/response";
import { z } from "zod";

export const GET: RequestHandler = async ({ params }) => {
    const parsed = z.object({ id: uuidParamSchema }).safeParse(params);

    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const listing = await getListingById(db, parsed.data.id);

    if (!listing) {
        apiError(404, "Listing not found", "NOT_FOUND");
    }

    return jsonOk(listing);
};
