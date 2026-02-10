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
export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const parsed = parseRequestSchema.safeParse(body);

        if (!parsed.success) {
            return zodErrorResponse(parsed.error);
        }

        // lets mock this response for now
        // const result = await parseSearchQuery(parsed.data.query);
        const result = {
            criteria: { suburb: "Baulkham Hills", propertyType: "house", bedsMin: 3, features: { pool: true } },
            confidence: "high",
            originalQuery: parsed.data.query,
        };
        console.log("Parsed search query result:", result);
        return jsonOk(result);
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
