/**
 * GET /api/v1/agent/listings — Agent's own listings (authenticated).
 *
 * Query params: status, sort, order, page, limit
 *
 * Returns: PaginatedResponse<ListingSummary>
 */

import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$db/connection";
import { getAgentListings, resolveAgencyId } from "$services/agent-listing-service";
import { agentListingSearchSchema, searchParamsToObject } from "$lib/server/api/schemas";
import { jsonOk, apiError, zodErrorResponse } from "$lib/server/api/response";
import { requireAgent } from "$lib/server/api/guards";
import type { AgentListingParams } from "$services/agent-listing-service";

export const GET: RequestHandler = async (event) => {
    const user = requireAgent(event);

    const raw = searchParamsToObject(event.url.searchParams);
    const parsed = agentListingSearchSchema.safeParse(raw);

    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const agencyId = await resolveAgencyId(db, user.id);
    if (!agencyId) {
        apiError(403, "No agency linked to your account", "NO_AGENCY");
    }

    const result = await getAgentListings(db, agencyId, parsed.data as AgentListingParams);
    return jsonOk(result);
};
