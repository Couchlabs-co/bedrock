/**
 * POST /api/v1/search/parse — Parse natural language search query into structured criteria.
 * Uses AWS Bedrock (Claude) to extract property search parameters from plain text.
 */

import type { RequestHandler } from "@sveltejs/kit";
import { parseSearchQuery } from "$services/bedrock-search-parser";
import { json } from "@sveltejs/kit";
import { jsonOk, apiError, zodErrorResponse } from "$lib/server/api/response";
import { z } from "zod";

const parseRequestSchema = z.object({
    query: z.string().min(1).max(500),
});

/**
 * Parse natural language search query.
 * Example request: { "query": "3 bedroom house in Baulkham Hills with swimming pool" }
 * Example response: {
 *   "criteria": { "suburb": "Baulkham Hills", "propertyType": "house", "bedsMin": 3, "features": { "pool": true } },
 *   "confidence": "high",
 *   "originalQuery": "..."
 * }
 */
export const POST: RequestHandler = async ({ request, fetch, url }) => {
    try {
        const body = await request.json();
        const parsed = parseRequestSchema.safeParse(body);

        if (!parsed.success) {
            return zodErrorResponse(parsed.error);
        }

        // TODO: Replace mock with Bedrock call when ready.
        // const result = await parseSearchQuery(parsed.data.query);
        const result = {
            criteria: {
                suburb: "Baulkham Hills",
                // Must align with listingSearchSchema
                propertyType: "house",
                bedsMin: 3,
                // Additional extracted fields can be included here and mapped below.
            },
            confidence: "high",
            originalQuery: parsed.data.query,
        };

        console.log("Parsed search query result:", result);

        // Call the internal listings search endpoint server-side.
        // Use the RequestEvent-provided `fetch` (not global fetch) and an absolute URL.
        const listingsUrl = new URL("/api/v1/listings/search", url);
        listingsUrl.searchParams.set("page", "1");
        listingsUrl.searchParams.set("limit", "20");

        if (result.criteria.suburb) {
            listingsUrl.searchParams.set("suburb", result.criteria.suburb);
        }

        if (result.criteria.propertyType) {
            listingsUrl.searchParams.set("propertyType", result.criteria.propertyType);
        }

        if (typeof result.criteria.bedsMin === "number") {
            listingsUrl.searchParams.set("bedsMin", String(result.criteria.bedsMin));
        }

        console.log("listingUrl: ", listingsUrl);
        const listingsResponse = await fetch(listingsUrl);
        const listingsBody = await listingsResponse.json();
        console.log("listingResponse", JSON.stringify(listingsBody));

        return jsonOk(
            {
                ...result,
                listings: listingsBody,
            },
            listingsResponse.status,
        );
    } catch (error) {
        console.error("NL search parse error:", error);

        // Check if it's an AWS credentials error
        if (error instanceof Error && error.message.includes("credentials")) {
            return apiError(503, "Search service unavailable: AWS credentials not configured", "SERVICE_UNAVAILABLE");
        }

        return json(
            {
                error: "Failed to parse search query",
                code: "PARSE_ERROR",
                details: { message: error instanceof Error ? error.message : "Unknown error" },
            },
            { status: 500 },
        );
    }
};
