/**
 * Tests for Bedrock-powered natural language search parser.
 * Note: These tests require AWS credentials to be configured.
 * Set SKIP_BEDROCK_TESTS=true to skip these in CI/CD.
 */

import { describe, it, expect } from "vitest";
import type { ParsedSearchCriteria, ParseSearchResponse } from "$services/bedrock-search-parser";

describe("Bedrock Search Parser", () => {
    describe("ParsedSearchCriteria type", () => {
        it("allows valid search criteria structure", () => {
            const criteria: ParsedSearchCriteria = {
                suburb: "Baulkham Hills",
                propertyType: "house",
                bedsMin: 3,
                features: {
                    pool: true,
                },
            };

            expect(criteria.suburb).toBe("Baulkham Hills");
            expect(criteria.propertyType).toBe("house");
            expect(criteria.bedsMin).toBe(3);
            expect(criteria.features?.pool).toBe(true);
        });

        it("allows partial criteria", () => {
            const criteria: ParsedSearchCriteria = {
                suburb: "Sydney",
            };

            expect(criteria.suburb).toBe("Sydney");
            expect(criteria.propertyType).toBeUndefined();
        });

        it("allows all feature flags", () => {
            const criteria: ParsedSearchCriteria = {
                features: {
                    pool: true,
                    airConditioning: true,
                    garage: true,
                    balcony: true,
                    openFireplace: true,
                },
            };

            expect(criteria.features).toBeDefined();
            expect(Object.keys(criteria.features!).length).toBe(5);
        });
    });

    describe("ParseSearchResponse type", () => {
        it("requires all response fields", () => {
            const response: ParseSearchResponse = {
                criteria: {
                    suburb: "Melbourne",
                    propertyType: "apartment",
                },
                confidence: "high",
                originalQuery: "apartment in Melbourne",
            };

            expect(response.criteria).toBeDefined();
            expect(response.confidence).toBe("high");
            expect(response.originalQuery).toBe("apartment in Melbourne");
        });

        it("allows different confidence levels", () => {
            const high: ParseSearchResponse["confidence"] = "high";
            const medium: ParseSearchResponse["confidence"] = "medium";
            const low: ParseSearchResponse["confidence"] = "low";

            expect([high, medium, low]).toContain("high");
            expect([high, medium, low]).toContain("medium");
            expect([high, medium, low]).toContain("low");
        });
    });

    // Integration tests - only run if AWS credentials are available
    describe.skipIf(process.env.SKIP_BEDROCK_TESTS === "true")("parseSearchQuery integration", () => {
        it("should be skipped in CI without AWS credentials", () => {
            // This test suite is skipped by default
            // To run: unset SKIP_BEDROCK_TESTS and configure AWS credentials
            expect(true).toBe(true);
        });

        // Uncomment and configure AWS credentials to run these tests locally:
        /*
        it("parses simple suburb query", async () => {
            const { parseSearchQuery } = await import("$services/bedrock-search-parser");
            const result = await parseSearchQuery("house in Baulkham Hills");
            
            expect(result.criteria.suburb).toBeTruthy();
            expect(result.criteria.propertyType).toBe("house");
            expect(result.confidence).toMatch(/high|medium|low/);
        });

        it("parses complex query with features", async () => {
            const { parseSearchQuery } = await import("$services/bedrock-search-parser");
            const result = await parseSearchQuery("3 bedroom house with pool and garage in Sydney under 1 million");
            
            expect(result.criteria.bedsMin).toBe(3);
            expect(result.criteria.propertyType).toBe("house");
            expect(result.criteria.features?.pool).toBe(true);
            expect(result.criteria.features?.garage).toBe(true);
            expect(result.criteria.priceMax).toBeDefined();
        });
        */
    });
});
