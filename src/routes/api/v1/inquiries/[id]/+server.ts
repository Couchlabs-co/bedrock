/**
 * PATCH /api/v1/inquiries/:id — Update inquiry status (agent/admin).
 *
 * Marks an inquiry as read or responded.
 * Only allows forward transitions: unread → read → responded.
 */

import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$db/connection";
import { updateInquiryStatus, InquiryError } from "$services/inquiry-service";
import { resolveAgencyId } from "$services/agent-listing-service";
import { uuidParamSchema, updateInquiryStatusSchema } from "$lib/server/api/schemas";
import { jsonOk, apiError, zodErrorResponse } from "$lib/server/api/response";
import { requireAgent } from "$lib/server/api/guards";
import type { UpdateInquiryStatusInput } from "$services/inquiry-service";
import { z } from "zod";

const idSchema = z.object({ id: uuidParamSchema });

export const PATCH: RequestHandler = async (event) => {
    const user = requireAgent(event);

    const paramsParsed = idSchema.safeParse(event.params);
    if (!paramsParsed.success) {
        return zodErrorResponse(paramsParsed.error);
    }

    const body = await event.request.json();
    const parsed = updateInquiryStatusSchema.safeParse(body);
    if (!parsed.success) {
        return zodErrorResponse(parsed.error);
    }

    const agencyId = await resolveAgencyId(db, user.id);
    if (!agencyId) {
        apiError(403, "No agency linked to your account", "NO_AGENCY");
    }

    try {
        const result = await updateInquiryStatus(
            db,
            paramsParsed.data.id,
            agencyId,
            parsed.data as UpdateInquiryStatusInput,
        );

        if (!result) {
            apiError(404, "Inquiry not found or not owned by your agency", "NOT_FOUND");
        }

        return jsonOk(result);
    } catch (err) {
        if (err instanceof InquiryError) {
            apiError(err.httpStatus, err.message, err.code);
        }
        throw err;
    }
};
