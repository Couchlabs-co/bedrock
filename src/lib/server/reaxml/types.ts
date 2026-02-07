/**
 * TypeScript interfaces for REAXML data structures.
 * These represent the normalised, parsed form of REAXML listings
 * before they are mapped to database columns.
 */

// ============================================================
// ENUMS & SIMPLE TYPES
// ============================================================

/** Supported REAXML property types */
export type ReaxmlPropertyType = "residential" | "rental" | "commercial" | "land" | "rural" | "holidayRental";

/** Listing status from REAXML @status attribute */
export type ReaxmlStatus = "current" | "withdrawn" | "offmarket" | "sold" | "leased" | "deleted";

/** Derived listing type for the database */
export type ListingType = "sale" | "rent" | "lease" | "both";

// ============================================================
// NESTED STRUCTURES
// ============================================================

/** Parsed listing agent extracted from REAXML <listingAgent> */
export interface ParsedAgent {
    position: number;
    name: string;
    email: string | null;
    phoneMobile: string | null;
    phoneOffice: string | null;
    agentIdCode: string | null;
    twitterUrl: string | null;
    facebookUrl: string | null;
    linkedinUrl: string | null;
}

/** Parsed address extracted from REAXML <address> */
export interface ParsedAddress {
    display: boolean;
    siteName: string | null;
    subNumber: string | null;
    lotNumber: string | null;
    streetNumber: string | null;
    street: string;
    suburb: string;
    suburbDisplay: boolean;
    state: string | null;
    postcode: string | null;
    region: string | null;
    country: string;
    municipality: string | null;
}

/** Parsed image, floorplan, or document reference */
export interface ParsedImage {
    type: "photo" | "floorplan" | "document";
    originalId: string | null;
    url: string;
    format: string | null;
    modTime: Date | null;
    sortOrder: number;
}

/** Parsed inspection time from REAXML <inspection> */
export interface ParsedInspection {
    description: string;
    startsAt: Date | null;
    endsAt: Date | null;
}

/** Parsed property features from REAXML <features> */
export interface ParsedFeatures {
    bedrooms: number | null;
    bathrooms: number | null;
    ensuites: number | null;
    garages: number | null;
    carports: number | null;
    openSpaces: number | null;
    toilets: number | null;
    livingAreas: number | null;
    remoteGarage: boolean;
    secureParking: boolean;
    airConditioning: boolean;
    alarmSystem: boolean;
    vacuumSystem: boolean;
    intercom: boolean;
    poolInground: boolean;
    poolAbove: boolean;
    tennisCourt: boolean;
    balcony: boolean;
    deck: boolean;
    courtyard: boolean;
    outdoorEnt: boolean;
    shed: boolean;
    fullyFenced: boolean;
    openFireplace: boolean;
    heatingType: string | null;
    hotWaterType: string | null;
    insideSpa: boolean;
    outsideSpa: boolean;
    broadband: boolean;
    builtInRobes: boolean;
    dishwasher: boolean;
    ductedCooling: boolean;
    ductedHeating: boolean;
    evapCooling: boolean;
    floorboards: boolean;
    gasHeating: boolean;
    gym: boolean;
    hydronicHeating: boolean;
    payTv: boolean;
    reverseCycle: boolean;
    rumpusRoom: boolean;
    splitSystemAc: boolean;
    splitSystemHeat: boolean;
    study: boolean;
    workshop: boolean;
    otherFeatures: string | null;
    petFriendly: boolean;
    furnished: boolean;
    smokersAllowed: boolean;
}

/** Parsed sold details from REAXML <soldDetails> */
export interface ParsedSoldDetails {
    price: number | null;
    priceDisplay: string | null;
    date: Date | null;
}

/** Parsed rural-specific features from REAXML <ruralFeatures> */
export interface ParsedRuralFeatures {
    fencing: string | null;
    annualRainfall: string | null;
    soilTypes: string | null;
    improvements: string | null;
    councilRates: string | null;
    irrigation: string | null;
    carryingCapacity: string | null;
    services: string | null;
}

// ============================================================
// UNIFIED PARSED LISTING
// ============================================================

/**
 * Unified parsed listing — the normalised representation of any REAXML listing type.
 * Produced by the parser pipeline from raw XML.
 */
export interface ParsedListing {
    // Identifiers
    agentId: string;
    uniqueId: string;

    // Classification
    propertyType: ReaxmlPropertyType;
    category: string | null;
    listingType: ListingType;
    status: ReaxmlStatus;
    authority: string | null;

    // Content
    headline: string | null;
    description: string | null;

    // Pricing
    price: number | null;
    priceDisplay: boolean;
    priceView: string | null;
    priceTax: string | null;

    // Rental
    rentAmount: number | null;
    rentPeriod: string | null;
    rentDisplay: boolean;
    bond: number | null;
    dateAvailable: Date | null;

    // Commercial
    commercialRent: number | null;
    outgoings: number | null;
    returnPercent: number | null;
    currentLeaseEnd: Date | null;
    tenancy: string | null;
    propertyExtent: string | null;
    carSpaces: number | null;
    zone: string | null;
    furtherOptions: string | null;

    // Land / Building
    landArea: number | null;
    landAreaUnit: string | null;
    buildingArea: number | null;
    buildingAreaUnit: string | null;
    frontage: number | null;
    energyRating: number | null;

    // Flags
    underOffer: boolean;
    isNewConstruction: boolean;
    isHomeLandPackage: boolean;
    depositTaken: boolean;

    // Dates
    yearBuilt: number | null;
    yearRenovated: number | null;
    auctionDate: Date | null;
    modTime: Date | null;

    // Sold
    soldDetails: ParsedSoldDetails | null;

    // Links
    externalLink: string | null;
    videoLink: string | null;

    // JSONB data
    ruralFeatures: ParsedRuralFeatures | null;

    // Nested structures
    address: ParsedAddress | null;
    features: ParsedFeatures | null;
    agents: ParsedAgent[];
    images: ParsedImage[];
    inspections: ParsedInspection[];
}

// ============================================================
// INGESTION RESULTS
// ============================================================

/** Result of processing a single listing through the ingestion pipeline */
export interface IngestionResult {
    agentId: string;
    uniqueId: string;
    propertyType: string;
    status: string;
    success: boolean;
    action: "created" | "updated" | "status_changed" | "skipped";
    error?: string;
    details?: Record<string, string>;
}

/** Result of processing a complete REAXML property list */
export interface IngestionReport {
    totalProcessed: number;
    successful: number;
    failed: number;
    results: IngestionResult[];
}
