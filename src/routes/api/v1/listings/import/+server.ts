/**
 * POST /api/v1/listings/import — REAXML bulk import endpoint.
 *
 * Accepts: application/xml or multipart/form-data (with XML file)
 * Auth: agent or admin
 *
 * Returns: IngestionReport with per-listing success/error details
 */

import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$db/connection";
import { ingestReaxml } from "$lib/server/reaxml/ingestion-service";
import { requireAgent } from "$lib/server/api/guards";
import { jsonOk, apiError } from "$lib/server/api/response";

export const POST: RequestHandler = async (event) => {
    requireAgent(event);

    const contentType = event.request.headers.get("content-type") ?? "";
    let xml: string;

    if (contentType.includes("multipart/form-data")) {
        const formData = await event.request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            apiError(400, "Missing 'file' field in multipart form data", "BAD_REQUEST");
        }

        xml = await file.text();
    } else if (contentType.includes("xml") || contentType.includes("text/plain")) {
        xml = await event.request.text();
    } else {
        apiError(415, "Unsupported content type. Use application/xml or multipart/form-data", "UNSUPPORTED_MEDIA_TYPE");
    }

    if (!xml || xml.trim().length === 0) {
        apiError(400, "Empty XML body", "BAD_REQUEST");
    }

    const report = await ingestReaxml(xml, db);

    const status = report.failed > 0 && report.successful === 0 ? 422 : 200;
    return jsonOk(report, status);
};
