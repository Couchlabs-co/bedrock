/**
 * Zod schemas for validating API query parameters.
 * Provides type-safe parsing with coercion from URL search params.
 */

import { z } from "zod";

/** Coerce a string to a positive integer, or undefined */
const positiveInt = z.coerce.number().int().positive().optional();

/** Coerce a string to a non-negative number, or undefined */
const nonNegativeNum = z.coerce.number().min(0).optional();

/** Listing search query params schema */
export const listingSearchSchema = z.object({
    q: z.string().max(200).optional(),
    suburb: z.string().max(100).optional(),
    postcode: z.string().max(10).optional(),
    state: z.string().max(20).optional(),
    propertyType: z.enum(["residential", "rental", "commercial", "land", "rural", "holidayRental"]).optional(),
    listingType: z.enum(["sale", "rent", "lease", "both"]).optional(),
    priceMin: nonNegativeNum,
    priceMax: nonNegativeNum,
    bedsMin: positiveInt,
    bathsMin: positiveInt,
    carsMin: positiveInt,
    sort: z.enum(["price", "date", "relevance"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/** Nearby search query params schema */
export const nearbySearchSchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    radiusKm: z.coerce.number().positive().max(50).optional().default(5),
    propertyType: z.enum(["residential", "rental", "commercial", "land", "rural", "holidayRental"]).optional(),
    listingType: z.enum(["sale", "rent", "lease", "both"]).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/** Suburb autocomplete query params schema */
export const suburbSearchSchema = z.object({
    q: z.string().min(2).max(100),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

/** UUID path parameter schema */
export const uuidParamSchema = z.string().uuid();

/**
 * Parse URL search params into a plain object for Zod validation.
 * Only includes keys that have non-empty values.
 */
export function searchParamsToObject(params: URLSearchParams): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
        if (value !== "") {
            obj[key] = value;
        }
    }
    return obj;
}
