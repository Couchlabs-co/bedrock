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
    propertyType: z.enum(["house", "apartment", "flat", "townhouse", "villa"]).optional(),
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

// ============================================================
// LISTING CRUD (Agent)
// ============================================================

/** Shared property type enum */
const propertyTypeEnum = z.enum(["residential", "rental", "commercial", "land", "rural", "holidayRental"]);

/** Shared listing type enum */
const listingTypeEnum = z.enum(["sale", "rent", "lease", "both"]);

/** Address input schema */
export const addressInputSchema = z.object({
    display: z.boolean().optional(),
    siteName: z.string().max(200).optional(),
    subNumber: z.string().max(20).optional(),
    lotNumber: z.string().max(20).optional(),
    streetNumber: z.string().max(20).optional(),
    street: z.string().min(1).max(200),
    suburb: z.string().min(1).max(100),
    state: z.string().max(20).optional(),
    postcode: z.string().max(10).optional(),
    country: z.string().max(10).optional(),
    municipality: z.string().max(100).optional(),
});

/** Features input schema */
export const featuresInputSchema = z.object({
    bedrooms: z.number().int().min(0).max(99).optional(),
    bathrooms: z.number().int().min(0).max(99).optional(),
    ensuites: z.number().int().min(0).max(99).optional(),
    garages: z.number().int().min(0).max(99).optional(),
    carports: z.number().int().min(0).max(99).optional(),
    openSpaces: z.number().int().min(0).max(99).optional(),
    toilets: z.number().int().min(0).max(99).optional(),
    livingAreas: z.number().int().min(0).max(99).optional(),
    airConditioning: z.boolean().optional(),
    alarmSystem: z.boolean().optional(),
    balcony: z.boolean().optional(),
    courtyard: z.boolean().optional(),
    deck: z.boolean().optional(),
    fullyFenced: z.boolean().optional(),
    intercom: z.boolean().optional(),
    openFireplace: z.boolean().optional(),
    outdoorEnt: z.boolean().optional(),
    poolInground: z.boolean().optional(),
    poolAbove: z.boolean().optional(),
    remoteGarage: z.boolean().optional(),
    secureParking: z.boolean().optional(),
    shed: z.boolean().optional(),
    spa: z.boolean().optional(),
    tennisCourt: z.boolean().optional(),
    vacuumSystem: z.boolean().optional(),
    heatingType: z.string().max(50).optional(),
    hotWaterType: z.string().max(50).optional(),
    otherFeatures: z.string().max(1000).optional(),
    petFriendly: z.boolean().optional(),
    furnished: z.boolean().optional(),
    smokersAllowed: z.boolean().optional(),
});

/** Image input schema */
export const imageInputSchema = z.object({
    type: z.enum(["photo", "floorplan", "document"]),
    url: z.string().url().max(2000),
    urlThumb: z.string().url().max(2000).optional(),
    urlMedium: z.string().url().max(2000).optional(),
    urlLarge: z.string().url().max(2000).optional(),
    format: z.string().max(20).optional(),
    title: z.string().max(200).optional(),
    sortOrder: z.number().int().min(0).optional(),
});

/** Inspection input schema */
export const inspectionInputSchema = z.object({
    description: z.string().min(1).max(500),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
});

/** Agent input schema */
export const agentInputSchema = z.object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(200).optional(),
    phoneMobile: z.string().max(30).optional(),
    phoneOffice: z.string().max(30).optional(),
    position: z.number().int().min(1).max(10).optional(),
});

/** Create listing schema — validated JSON body */
export const createListingSchema = z.object({
    propertyType: propertyTypeEnum,
    category: z.string().max(100).optional(),
    listingType: listingTypeEnum,
    status: z.enum(["current", "offmarket"]).optional(),
    authority: z.string().max(50).optional(),
    headline: z.string().max(500).optional(),
    description: z.string().max(10000).optional(),
    price: z.number().min(0).optional(),
    priceDisplay: z.boolean().optional(),
    priceView: z.string().max(200).optional(),
    priceTax: z.enum(["inclusive", "exclusive", "unknown"]).optional(),
    rentAmount: z.number().min(0).optional(),
    rentPeriod: z.enum(["week", "month"]).optional(),
    bond: z.number().min(0).optional(),
    dateAvailable: z.string().datetime().optional(),
    commercialRent: z.number().min(0).optional(),
    outgoings: z.number().min(0).optional(),
    returnPercent: z.number().min(0).max(100).optional(),
    currentLeaseEnd: z.string().datetime().optional(),
    carSpaces: z.number().int().min(0).optional(),
    zone: z.string().max(100).optional(),
    furtherOptions: z.string().max(1000).optional(),
    landArea: z.number().min(0).optional(),
    landAreaUnit: z.enum(["sqm", "acre", "hectare"]).optional(),
    buildingArea: z.number().min(0).optional(),
    buildingAreaUnit: z.enum(["sqm", "acre", "hectare"]).optional(),
    frontage: z.number().min(0).optional(),
    energyRating: z.number().min(0).max(10).optional(),
    underOffer: z.boolean().optional(),
    isNewConstruction: z.boolean().optional(),
    depositTaken: z.boolean().optional(),
    yearBuilt: z.number().int().min(1800).max(2100).optional(),
    auctionDate: z.string().datetime().optional(),
    externalLink: z.string().url().max(2000).optional(),
    videoLink: z.string().url().max(2000).optional(),
    address: addressInputSchema.optional(),
    features: featuresInputSchema.optional(),
    images: z.array(imageInputSchema).max(50).optional(),
    inspections: z.array(inspectionInputSchema).max(20).optional(),
    agents: z.array(agentInputSchema).max(10).optional(),
});

/** Status change schema */
export const statusChangeSchema = z.object({
    status: z.enum(["current", "withdrawn", "offmarket", "sold", "leased", "deleted"]),
    soldPrice: z.number().min(0).optional(),
    soldDate: z.string().datetime().optional(),
});

/** Agent listing search params */
export const agentListingSearchSchema = z.object({
    status: z.enum(["current", "withdrawn", "offmarket", "sold", "leased", "deleted"]).optional(),
    sort: z.enum(["price", "date", "status"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ============================================================
// INQUIRIES
// ============================================================

/** Create inquiry schema — public, no auth required */
export const createInquirySchema = z.object({
    listingId: z.string().uuid(),
    senderName: z.string().min(1).max(200),
    senderEmail: z.string().email().max(200),
    senderPhone: z.string().max(30).optional(),
    message: z.string().min(1).max(5000),
});

/** Update inquiry status schema — agent marks as read/responded */
export const updateInquiryStatusSchema = z.object({
    status: z.enum(["read", "responded"]),
});

/** Agent inquiry list search params */
export const inquirySearchSchema = z.object({
    status: z.enum(["unread", "read", "responded"]).optional(),
    listingId: z.string().uuid().optional(),
    sort: z.enum(["date"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

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
