/**
 * GET /api/v1/suburbs — Suburb autocomplete.
 *
 * Query params: q (min 2 chars), limit (optional, default 10, max 50)
 *
 * Uses pg_trgm similarity for fuzzy suburb matching.
 * Returns: SuburbResult[]
 */

import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$db/connection";
import { searchSuburbs } from "$services/listing-service";
import { suburbSearchSchema, searchParamsToObject } from "$lib/server/api/schemas";
import { jsonOk, zodErrorResponse } from "$lib/server/api/response";

export const GET: RequestHandler = async ({ url }) => {
    const raw = searchParamsToObject(url.searchParams);
    const parsed = suburbSearchSchema.safeParse(raw);

    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const result = await searchSuburbs(db, parsed.data.q, parsed.data.limit);
    return jsonOk(result);
};
