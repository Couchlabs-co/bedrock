/**
 * REAXML mapper — converts ParsedListing objects into database insert shapes.
 * Each function produces an object matching a Drizzle table's insert type.
 */

import type { ParsedListing, ParsedAddress, ParsedFeatures, ParsedImage, ParsedInspection, ParsedAgent } from "./types";

// ============================================================
// TYPES — DB insert shapes (decoupled from Drizzle to keep testable)
// ============================================================

/** Insert shape for the listings table */
export interface ListingInsert {
    agencyId: string;
    crmUniqueId: string;
    crmAgentId: string;
    propertyType: string;
    category: string | null;
    listingType: string;
    status: string;
    authority: string | null;
    headline: string | null;
    description: string | null;
    price: string | null;
    priceDisplay: boolean;
    priceView: string | null;
    priceTax: string | null;
    rentAmount: string | null;
    rentPeriod: string | null;
    rentDisplay: boolean;
    bond: string | null;
    dateAvailable: Date | null;
    commercialRent: string | null;
    outgoings: string | null;
    returnPercent: string | null;
    currentLeaseEnd: Date | null;
    tenancy: string | null;
    propertyExtent: string | null;
    carSpaces: number | null;
    zone: string | null;
    furtherOptions: string | null;
    landArea: string | null;
    landAreaUnit: string | null;
    buildingArea: string | null;
    buildingAreaUnit: string | null;
    frontage: string | null;
    energyRating: string | null;
    underOffer: boolean;
    isNewConstruction: boolean;
    isHomeLandPackage: boolean;
    depositTaken: boolean;
    yearBuilt: number | null;
    yearRenovated: number | null;
    auctionDate: Date | null;
    soldPrice: string | null;
    soldPriceDisplay: string | null;
    soldDate: Date | null;
    externalLink: string | null;
    videoLink: string | null;
    ruralFeatures: Record<string, unknown> | null;
    modTime: Date | null;
}

/** Insert shape for listing_addresses table */
export interface AddressInsert {
    listingId: string;
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
    formatted: string;
}

/** Insert shape for listing_features table */
export interface FeaturesInsert extends Record<string, unknown> {
    listingId: string;
}

/** Insert shape for listing_images table */
export interface ImageInsert {
    listingId: string;
    type: string;
    sortOrder: number;
    originalId: string | null;
    url: string;
    format: string | null;
    modTime: Date | null;
}

/** Insert shape for listing_inspections table */
export interface InspectionInsert {
    listingId: string;
    description: string;
    startsAt: Date | null;
    endsAt: Date | null;
}

/** Insert shape for listing_agents table */
export interface AgentInsert {
    listingId: string;
    position: number;
    name: string;
    email: string | null;
    phoneMobile: string | null;
    phoneOffice: string | null;
    agentIdCode: string | null;
}

/** Complete mapped listing ready for database insertion */
export interface MappedListing {
    listing: ListingInsert;
    address: AddressInsert | null;
    features: FeaturesInsert | null;
    images: ImageInsert[];
    inspections: InspectionInsert[];
    agents: AgentInsert[];
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Map a ParsedListing to database insert shapes.
 * The listingId parameter is used to link child records.
 *
 * @param parsed - Normalised listing from the parser
 * @param agencyId - Resolved agency UUID from database lookup
 * @param listingId - UUID for the listing (generated or existing)
 * @returns Complete mapped listing ready for insertion
 */
export function mapListingToDb(parsed: ParsedListing, agencyId: string, listingId: string): MappedListing {
    return {
        listing: mapListing(parsed, agencyId),
        address: parsed.address ? mapAddress(parsed.address, listingId) : null,
        features: parsed.features ? mapFeatures(parsed.features, listingId) : null,
        images: parsed.images.map((img) => mapImage(img, listingId)),
        inspections: parsed.inspections.map((insp) => mapInspection(insp, listingId)),
        agents: parsed.agents.map((agent) => mapAgent(agent, listingId)),
    };
}

// ============================================================
// INDIVIDUAL MAPPERS
// ============================================================

/** Map ParsedListing to listings table insert (numeric → string for Drizzle numeric columns) */
function mapListing(parsed: ParsedListing, agencyId: string): ListingInsert {
    return {
        agencyId,
        crmUniqueId: parsed.uniqueId,
        crmAgentId: parsed.agentId,
        propertyType: parsed.propertyType,
        category: parsed.category,
        listingType: parsed.listingType,
        status: parsed.status,
        authority: parsed.authority,
        headline: parsed.headline,
        description: parsed.description,
        price: numericToString(parsed.price),
        priceDisplay: parsed.priceDisplay,
        priceView: parsed.priceView,
        priceTax: parsed.priceTax,
        rentAmount: numericToString(parsed.rentAmount),
        rentPeriod: parsed.rentPeriod,
        rentDisplay: parsed.rentDisplay,
        bond: numericToString(parsed.bond),
        dateAvailable: parsed.dateAvailable,
        commercialRent: numericToString(parsed.commercialRent),
        outgoings: numericToString(parsed.outgoings),
        returnPercent: numericToString(parsed.returnPercent),
        currentLeaseEnd: parsed.currentLeaseEnd,
        tenancy: parsed.tenancy,
        propertyExtent: parsed.propertyExtent,
        carSpaces: parsed.carSpaces,
        zone: parsed.zone,
        furtherOptions: parsed.furtherOptions,
        landArea: numericToString(parsed.landArea),
        landAreaUnit: parsed.landAreaUnit,
        buildingArea: numericToString(parsed.buildingArea),
        buildingAreaUnit: parsed.buildingAreaUnit,
        frontage: numericToString(parsed.frontage),
        energyRating: numericToString(parsed.energyRating),
        underOffer: parsed.underOffer,
        isNewConstruction: parsed.isNewConstruction,
        isHomeLandPackage: parsed.isHomeLandPackage,
        depositTaken: parsed.depositTaken,
        yearBuilt: parsed.yearBuilt,
        yearRenovated: parsed.yearRenovated,
        auctionDate: parsed.auctionDate,
        soldPrice: numericToString(parsed.soldDetails?.price ?? null),
        soldPriceDisplay: parsed.soldDetails?.priceDisplay ?? null,
        soldDate: parsed.soldDetails?.date ?? null,
        externalLink: parsed.externalLink,
        videoLink: parsed.videoLink,
        ruralFeatures: parsed.ruralFeatures as Record<string, unknown> | null,
        modTime: parsed.modTime,
    };
}

/** Map ParsedAddress to listing_addresses table insert */
function mapAddress(addr: ParsedAddress, listingId: string): AddressInsert {
    return {
        listingId,
        display: addr.display,
        siteName: addr.siteName,
        subNumber: addr.subNumber,
        lotNumber: addr.lotNumber,
        streetNumber: addr.streetNumber,
        street: addr.street,
        suburb: addr.suburb,
        suburbDisplay: addr.suburbDisplay,
        state: addr.state,
        postcode: addr.postcode,
        region: addr.region,
        country: addr.country,
        municipality: addr.municipality,
        formatted: formatAddress(addr),
    };
}

/** Map ParsedFeatures to listing_features table insert */
function mapFeatures(feat: ParsedFeatures, listingId: string): FeaturesInsert {
    return {
        listingId,
        bedrooms: feat.bedrooms,
        bathrooms: feat.bathrooms,
        ensuites: feat.ensuites,
        garages: feat.garages,
        carports: feat.carports,
        openSpaces: feat.openSpaces,
        toilets: feat.toilets,
        livingAreas: feat.livingAreas,
        remoteGarage: feat.remoteGarage,
        secureParking: feat.secureParking,
        airConditioning: feat.airConditioning,
        alarmSystem: feat.alarmSystem,
        vacuumSystem: feat.vacuumSystem,
        intercom: feat.intercom,
        poolInground: feat.poolInground,
        poolAbove: feat.poolAbove,
        spa: false,
        tennisCourt: feat.tennisCourt,
        balcony: feat.balcony,
        deck: feat.deck,
        courtyard: feat.courtyard,
        outdoorEnt: feat.outdoorEnt,
        shed: feat.shed,
        fullyFenced: feat.fullyFenced,
        openFireplace: feat.openFireplace,
        heatingType: feat.heatingType,
        hotWaterType: feat.hotWaterType,
        insideSpa: feat.insideSpa,
        outsideSpa: feat.outsideSpa,
        broadband: feat.broadband,
        builtInRobes: feat.builtInRobes,
        dishwasher: feat.dishwasher,
        ductedCooling: feat.ductedCooling,
        ductedHeating: feat.ductedHeating,
        evapCooling: feat.evapCooling,
        floorboards: feat.floorboards,
        gasHeating: feat.gasHeating,
        gym: feat.gym,
        hydronicHeating: feat.hydronicHeating,
        payTv: feat.payTv,
        reverseCycle: feat.reverseCycle,
        rumpusRoom: feat.rumpusRoom,
        splitSystemAc: feat.splitSystemAc,
        splitSystemHeat: feat.splitSystemHeat,
        study: feat.study,
        workshop: feat.workshop,
        otherFeatures: feat.otherFeatures,
        petFriendly: feat.petFriendly,
        furnished: feat.furnished,
        smokersAllowed: feat.smokersAllowed,
    };
}

/** Map ParsedImage to listing_images table insert */
function mapImage(img: ParsedImage, listingId: string): ImageInsert {
    return {
        listingId,
        type: img.type,
        sortOrder: img.sortOrder,
        originalId: img.originalId,
        url: img.url,
        format: img.format,
        modTime: img.modTime,
    };
}

/** Map ParsedInspection to listing_inspections table insert */
function mapInspection(insp: ParsedInspection, listingId: string): InspectionInsert {
    return {
        listingId,
        description: insp.description,
        startsAt: insp.startsAt,
        endsAt: insp.endsAt,
    };
}

/** Map ParsedAgent to listing_agents table insert */
function mapAgent(agent: ParsedAgent, listingId: string): AgentInsert {
    return {
        listingId,
        position: agent.position,
        name: agent.name,
        email: agent.email,
        phoneMobile: agent.phoneMobile,
        phoneOffice: agent.phoneOffice,
        agentIdCode: agent.agentIdCode,
    };
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Convert a number to string for Drizzle numeric columns.
 * Drizzle's numeric() type expects string values.
 */
function numericToString(value: number | null): string | null {
    if (value === null || value === undefined) return null;
    return String(value);
}

/**
 * Format address parts into a single display string.
 * Example: "2/39 Main Road, RICHMOND VIC 3121"
 */
export function formatAddress(addr: ParsedAddress): string {
    const parts: string[] = [];

    if (addr.subNumber) {
        parts.push(`${addr.subNumber}/`);
    }

    if (addr.lotNumber && !addr.streetNumber) {
        parts.push(`Lot ${addr.lotNumber} `);
    }

    if (addr.streetNumber) {
        parts.push(`${addr.streetNumber} `);
    }

    parts.push(addr.street);
    parts.push(`, ${addr.suburb}`);

    if (addr.state) {
        parts.push(` ${addr.state.toUpperCase()}`);
    }

    if (addr.postcode) {
        parts.push(` ${addr.postcode}`);
    }

    return parts.join("");
}
