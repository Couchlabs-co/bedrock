/**
 * POST /api/v1/inquiries — Send an inquiry on a listing (public).
 * GET  /api/v1/inquiries — Agent views their inquiries (authenticated).
 *
 * POST is public — no login required. If the user is authenticated,
 * their user_id is linked for inquiry history in their account.
 *
 * GET requires agent/admin auth — returns inquiries on the agent's
 * agency's listings only.
 */

import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$db/connection";
import { createInquiry, getAgentInquiries, InquiryError } from "$services/inquiry-service";
import { resolveAgencyId } from "$services/agent-listing-service";
import { createInquirySchema, inquirySearchSchema, searchParamsToObject } from "$lib/server/api/schemas";
import { jsonOk, apiError, zodErrorResponse } from "$lib/server/api/response";
import { requireAgent } from "$lib/server/api/guards";
import type { CreateInquiryInput, InquirySearchParams } from "$services/inquiry-service";

export const POST: RequestHandler = async (event) => {
    const body = await event.request.json();
    const parsed = createInquirySchema.safeParse(body);

    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    // Attach user_id if authenticated (optional — public endpoint)
    const userId = event.locals.user?.id ?? null;

    try {
        const result = await createInquiry(db, parsed.data as CreateInquiryInput, userId);
        return jsonOk(result, 201);
    } catch (err) {
        if (err instanceof InquiryError) {
            apiError(err.httpStatus, err.message, err.code);
        }
        throw err;
    }
};

export const GET: RequestHandler = async (event) => {
    const user = requireAgent(event);

    const raw = searchParamsToObject(event.url.searchParams);
    const parsed = inquirySearchSchema.safeParse(raw);

    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const agencyId = await resolveAgencyId(db, user.id);
    if (!agencyId) {
        apiError(403, "No agency linked to your account", "NO_AGENCY");
    }

    const result = await getAgentInquiries(db, agencyId, parsed.data as InquirySearchParams);
    return jsonOk(result);
};
