/**
 * REAXML parser — converts raw XML into an array of ParsedListing objects.
 *
 * Handles all 6 REAXML property types: residential, rental, commercial,
 * land, rural, and holidayRental. Uses fast-xml-parser with DTD-aware
 * configuration to handle REAXML's attribute-heavy format.
 */

import { XMLParser } from "fast-xml-parser";
import type {
    ReaxmlPropertyType,
    ReaxmlStatus,
    ListingType,
    ParsedListing,
    ParsedAddress,
    ParsedAgent,
    ParsedImage,
    ParsedFeatures,
    ParsedInspection,
    ParsedSoldDetails,
    ParsedRuralFeatures,
} from "./types";
import {
    coerceBoolean,
    coerceInt,
    coerceFloat,
    coerceString,
    parseReaDate,
    normaliseAreaUnit,
    extractText,
    SQUARE_TO_SQM,
} from "../utils/coerce";

// ============================================================
// CONSTANTS
// ============================================================

const LISTING_TYPES: ReaxmlPropertyType[] = ["residential", "rental", "commercial", "land", "rural", "holidayRental"];

/** Elements that can appear multiple times and should always be parsed as arrays */
const ARRAY_ELEMENTS = new Set([
    "residential",
    "rental",
    "commercial",
    "land",
    "rural",
    "holidayRental",
    "listingAgent",
    "img",
    "floorplan",
    "inspection",
    "document",
    "telephone",
]);

// ============================================================
// XML PARSER CONFIGURATION
// ============================================================

/**
 * Configured fast-xml-parser instance for REAXML documents.
 * - Attributes are preserved with @_ prefix
 * - Repeatable elements are always returned as arrays
 * - Values are NOT auto-parsed (we handle coercion ourselves)
 */
const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name: string) => ARRAY_ELEMENTS.has(name),
    trimValues: true,
    processEntities: false,
    parseTagValue: false,
    parseAttributeValue: false,
});

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Parse a REAXML property list XML string into an array of ParsedListings.
 *
 * @param xml - Raw REAXML XML string (full propertyList document)
 * @returns Array of parsed and normalised listings
 * @throws Error if the XML is missing the <propertyList> root element
 */
export function parseReaxml(xml: string): ParsedListing[] {
    const parsed = xmlParser.parse(xml);
    const propertyList = parsed?.propertyList;

    if (!propertyList) {
        throw new Error("Invalid REAXML: missing <propertyList> root element");
    }

    const listings: ParsedListing[] = [];

    for (const listingType of LISTING_TYPES) {
        const items = propertyList[listingType];
        if (!items) continue;

        const itemArray = Array.isArray(items) ? items : [items];

        for (const item of itemArray) {
            const listing = mapRawListing(item, listingType);
            if (listing) {
                listings.push(listing);
            }
        }
    }

    return listings;
}

// ============================================================
// CORE MAPPING
// ============================================================

/**
 * Map a single raw XML listing object to a ParsedListing.
 * Returns null if required identifiers (agentID, uniqueID) are missing.
 */
function mapRawListing(raw: Record<string, unknown>, propertyType: ReaxmlPropertyType): ParsedListing | null {
    const agentId = coerceString(raw.agentID);
    const uniqueId = coerceString(raw.uniqueID);

    if (!agentId || !uniqueId) {
        return null;
    }

    const status = (coerceString(raw["@_status"]) ?? "current") as ReaxmlStatus;

    return {
        agentId,
        uniqueId,
        propertyType,
        category: extractCategory(raw, propertyType),
        listingType: deriveListingType(raw, propertyType),
        status,
        authority: extractAuthority(raw),

        headline: coerceString(raw.headline),
        description: coerceString(raw.description),

        price: extractPrice(raw),
        priceDisplay: extractPriceDisplay(raw),
        priceView: coerceString(raw.priceView),
        priceTax: extractPriceTax(raw),

        rentAmount: coerceFloat(extractText(raw.rent)),
        rentPeriod: extractRentPeriod(raw),
        rentDisplay: extractRentDisplay(raw),
        bond: coerceFloat(raw.bond),
        dateAvailable: parseReaDate(raw.dateAvailable),

        commercialRent: coerceFloat(extractText(raw.commercialRent)),
        outgoings: coerceFloat(extractText(raw.outgoings)),
        returnPercent: coerceFloat(extractReturnValue(raw)),
        currentLeaseEnd: parseReaDate(raw.currentLeaseEndDate),
        tenancy: coerceString(raw.tenancy),
        propertyExtent: coerceString(raw.propertyExtent),
        carSpaces: coerceInt(raw.carSpaces),
        zone: coerceString(raw.zone),
        furtherOptions: coerceString(raw.furtherOptions),

        landArea: extractArea(raw.landDetails as Record<string, unknown> | undefined),
        landAreaUnit: extractAreaUnit(raw.landDetails as Record<string, unknown> | undefined),
        buildingArea: extractArea(raw.buildingDetails as Record<string, unknown> | undefined),
        buildingAreaUnit: extractAreaUnit(raw.buildingDetails as Record<string, unknown> | undefined),
        frontage: extractFrontage(raw.landDetails as Record<string, unknown> | undefined),
        energyRating: extractEnergyRating(raw.buildingDetails as Record<string, unknown> | undefined),

        underOffer: coerceBoolean((raw.underOffer as Record<string, unknown>)?.["@_value"]),
        isNewConstruction: coerceBoolean(raw.newConstruction),
        isHomeLandPackage: coerceBoolean((raw.isHomeLandPackage as Record<string, unknown>)?.["@_value"]),
        depositTaken: coerceBoolean((raw.depositTaken as Record<string, unknown>)?.["@_value"]),

        yearBuilt: coerceInt((raw.yearBuilt as Record<string, unknown>)?.["@_value"] ?? raw.yearBuilt),
        yearRenovated: coerceInt(
            (raw.yearLastRenovated as Record<string, unknown>)?.["@_value"] ?? raw.yearLastRenovated,
        ),
        auctionDate: parseReaDate((raw.auction as Record<string, unknown>)?.["@_date"]),
        modTime: parseReaDate(raw["@_modTime"]),

        soldDetails: extractSoldDetails(raw),

        externalLink: coerceString((raw.externalLink as Record<string, unknown>)?.["@_href"]),
        videoLink: coerceString((raw.videoLink as Record<string, unknown>)?.["@_href"]),

        ruralFeatures: extractRuralFeatures(raw),

        address: extractAddress(raw),
        features: extractFeatures(raw),
        agents: extractAgents(raw),
        images: extractImages(raw),
        inspections: extractInspections(raw),
    };
}

// ============================================================
// CLASSIFICATION EXTRACTORS
// ============================================================

/** Extract the category name from the appropriate element per property type */
function extractCategory(raw: Record<string, unknown>, propertyType: ReaxmlPropertyType): string | null {
    switch (propertyType) {
        case "commercial":
            return coerceString((raw.commercialCategory as Record<string, unknown>)?.["@_name"]);
        case "land":
            return coerceString((raw.landCategory as Record<string, unknown>)?.["@_name"]);
        case "rural":
            return coerceString((raw.ruralCategory as Record<string, unknown>)?.["@_name"]);
        default:
            return coerceString((raw.category as Record<string, unknown>)?.["@_name"]);
    }
}

/** Derive the listing type (sale/rent/lease/both) from property type and XML data */
function deriveListingType(raw: Record<string, unknown>, propertyType: ReaxmlPropertyType): ListingType {
    if (propertyType === "rental" || propertyType === "holidayRental") {
        return "rent";
    }

    if (propertyType === "commercial") {
        const value = coerceString((raw.commercialListingType as Record<string, unknown>)?.["@_value"]);
        if (value === "lease") return "lease";
        if (value === "both") return "both";
        return "sale";
    }

    return "sale";
}

/** Extract authority from either <authority> or <commercialAuthority> */
function extractAuthority(raw: Record<string, unknown>): string | null {
    return (
        coerceString((raw.authority as Record<string, unknown>)?.["@_value"]) ??
        coerceString((raw.commercialAuthority as Record<string, unknown>)?.["@_value"])
    );
}

// ============================================================
// PRICING EXTRACTORS
// ============================================================

/** Extract numeric price from <price> element (handles text+attribute nodes) */
function extractPrice(raw: Record<string, unknown>): number | null {
    return coerceFloat(extractText(raw.price));
}

/** Extract price display flag from <price display="yes|no"> */
function extractPriceDisplay(raw: Record<string, unknown>): boolean {
    const display = (raw.price as Record<string, unknown>)?.["@_display"];
    if (display === undefined) return true;
    return coerceBoolean(display);
}

/** Extract price tax attribute */
function extractPriceTax(raw: Record<string, unknown>): string | null {
    return coerceString((raw.price as Record<string, unknown>)?.["@_tax"]) ?? "unknown";
}

/** Extract rent period from <rent period="week|month"> */
function extractRentPeriod(raw: Record<string, unknown>): string | null {
    return coerceString((raw.rent as Record<string, unknown>)?.["@_period"]);
}

/** Extract rent display flag */
function extractRentDisplay(raw: Record<string, unknown>): boolean {
    const display = (raw.rent as Record<string, unknown>)?.["@_display"];
    if (display === undefined) return true;
    return coerceBoolean(display);
}

/** Extract return value from <return> element */
function extractReturnValue(raw: Record<string, unknown>): string | null {
    return extractText(raw.return);
}

// ============================================================
// AREA EXTRACTORS
// ============================================================

/**
 * Extract area value from land/building details.
 * Converts "square" (Australian squares) to sqm automatically.
 */
function extractArea(details: Record<string, unknown> | undefined): number | null {
    if (!details?.area) return null;

    const text = extractText(details.area);
    const value = coerceFloat(text);
    if (value === null) return null;

    const unit = normaliseAreaUnit((details.area as Record<string, unknown>)?.["@_unit"] as string | undefined);

    // Convert squares to sqm
    if (unit === "square") {
        return Math.round(value * SQUARE_TO_SQM * 100) / 100;
    }

    return value;
}

/**
 * Extract normalised area unit.
 * "square" is converted to "sqm" since values are also converted.
 */
function extractAreaUnit(details: Record<string, unknown> | undefined): string | null {
    if (!details?.area) return null;

    const unit = normaliseAreaUnit((details.area as Record<string, unknown>)?.["@_unit"] as string | undefined);

    // We convert square values to sqm, so unit should match
    if (unit === "square") return "sqm";
    return unit;
}

/** Extract frontage from land details */
function extractFrontage(details: Record<string, unknown> | undefined): number | null {
    if (!details?.frontage) return null;
    return coerceFloat(extractText(details.frontage));
}

/** Extract energy rating from building details */
function extractEnergyRating(details: Record<string, unknown> | undefined): number | null {
    if (!details) return null;
    return coerceFloat(details.energyRating);
}

// ============================================================
// SOLD DETAILS
// ============================================================

/** Extract sold details from <soldDetails> element */
function extractSoldDetails(raw: Record<string, unknown>): ParsedSoldDetails | null {
    const sold = raw.soldDetails as Record<string, unknown> | undefined;
    if (!sold) return null;

    return {
        price: coerceFloat(extractText(sold.price)),
        priceDisplay: coerceString((sold.price as Record<string, unknown>)?.["@_display"]),
        date: parseReaDate(sold.date),
    };
}

// ============================================================
// RURAL FEATURES
// ============================================================

/** Extract rural-specific features from <ruralFeatures> element */
function extractRuralFeatures(raw: Record<string, unknown>): ParsedRuralFeatures | null {
    const rf = raw.ruralFeatures as Record<string, unknown> | undefined;
    if (!rf) return null;

    return {
        fencing: coerceString(rf.fencing),
        annualRainfall: coerceString(rf.annualRainfall),
        soilTypes: coerceString(rf.soilTypes),
        improvements: coerceString(rf.improvements),
        councilRates: coerceString(rf.councilRates),
        irrigation: coerceString(rf.irrigation),
        carryingCapacity: coerceString(rf.carryingCapacity),
        services: coerceString(rf.services),
    };
}

// ============================================================
// ADDRESS
// ============================================================

/** Extract and normalise address from <address> element */
function extractAddress(raw: Record<string, unknown>): ParsedAddress | null {
    const addr = raw.address as Record<string, unknown> | undefined;
    if (!addr) return null;

    const street = coerceString(addr.street);

    // suburb can be a plain string or object with #text and @_display
    const suburbRaw = addr.suburb;
    let suburbText: string | null;
    let suburbDisplay = true;

    if (suburbRaw && typeof suburbRaw === "object") {
        const suburbObj = suburbRaw as Record<string, unknown>;
        suburbText = coerceString(suburbObj["#text"]);
        suburbDisplay = coerceBoolean(suburbObj["@_display"] ?? true);
    } else {
        suburbText = coerceString(suburbRaw);
    }

    if (!street || !suburbText) return null;

    return {
        display: coerceBoolean(addr["@_display"] ?? true),
        siteName: coerceString(addr.site),
        subNumber: coerceString(addr.subNumber),
        lotNumber: coerceString(addr.lotNumber),
        streetNumber: coerceString(addr.streetNumber),
        street,
        suburb: suburbText,
        suburbDisplay,
        state: coerceString(addr.state),
        postcode: coerceString(addr.postcode),
        region: coerceString(addr.region),
        country: coerceString(addr.country) ?? "AUS",
        municipality: coerceString(raw.municipality),
    };
}

// ============================================================
// FEATURES
// ============================================================

/** Extract all property features from <features> and <allowances> elements */
function extractFeatures(raw: Record<string, unknown>): ParsedFeatures | null {
    const f = raw.features as Record<string, unknown> | undefined;
    if (!f) return null;

    const allowances = (raw.allowances ?? {}) as Record<string, unknown>;

    return {
        bedrooms: coerceInt(f.bedrooms),
        bathrooms: coerceInt(f.bathrooms),
        ensuites: coerceInt(f.ensuite),
        garages: coerceInt(f.garages),
        carports: coerceInt(f.carports),
        openSpaces: coerceInt(f.openSpaces),
        toilets: coerceInt(f.toilets),
        livingAreas: coerceInt(f.livingAreas),
        remoteGarage: coerceBoolean(f.remoteGarage),
        secureParking: coerceBoolean(f.secureParking),
        airConditioning: coerceBoolean(f.airConditioning),
        alarmSystem: coerceBoolean(f.alarmSystem),
        vacuumSystem: coerceBoolean(f.vacuumSystem),
        intercom: coerceBoolean(f.intercom),
        poolInground: extractPoolInground(f),
        poolAbove: extractPoolAbove(f),
        tennisCourt: coerceBoolean(f.tennisCourt),
        balcony: coerceBoolean(f.balcony),
        deck: coerceBoolean(f.deck),
        courtyard: coerceBoolean(f.courtyard),
        outdoorEnt: coerceBoolean(f.outdoorEnt),
        shed: coerceBoolean(f.shed),
        fullyFenced: coerceBoolean(f.fullyFenced),
        openFireplace: coerceBoolean(f.openFirePlace),
        heatingType: coerceString((f.heating as Record<string, unknown>)?.["@_type"]),
        hotWaterType: coerceString((f.hotWaterService as Record<string, unknown>)?.["@_type"]),
        insideSpa: extractSpaInside(f),
        outsideSpa: coerceBoolean(f.outsideSpa),
        broadband: coerceBoolean(f.broadband),
        builtInRobes: coerceBoolean(f.builtInRobes),
        dishwasher: coerceBoolean(f.dishwasher),
        ductedCooling: coerceBoolean(f.ductedCooling),
        ductedHeating: coerceBoolean(f.ductedHeating),
        evapCooling: coerceBoolean(f.evapCooling),
        floorboards: coerceBoolean(f.floorboards),
        gasHeating: coerceBoolean(f.gasHeating),
        gym: coerceBoolean(f.gym),
        hydronicHeating: coerceBoolean(f.hydronicHeating),
        payTv: coerceBoolean(f.payTv),
        reverseCycle: coerceBoolean(f.reverseCycle),
        rumpusRoom: coerceBoolean(f.rumpusRoom),
        splitSystemAc: coerceBoolean(f.splitSystemAc),
        splitSystemHeat: coerceBoolean(f.splitSystemHeat),
        study: coerceBoolean(f.study),
        workshop: coerceBoolean(f.workshop),
        otherFeatures: coerceString(f.otherFeatures),
        petFriendly: coerceBoolean(allowances.petFriendly ?? f.petFriendly),
        furnished: coerceBoolean(allowances.furnished ?? f.furnished),
        smokersAllowed: coerceBoolean(allowances.smoker ?? f.smokers),
    };
}

/**
 * Handle pool with type attribute.
 * <pool type="inground">yes</pool> → poolInground = true
 */
function extractPoolInground(f: Record<string, unknown>): boolean {
    const pool = f.pool;
    if (!pool) return coerceBoolean(f.poolInGround);

    const poolObj = pool as Record<string, unknown>;
    const type = poolObj?.["@_type"];
    const value = extractText(pool) ?? pool;

    if (type === "inground" || type === undefined) {
        return coerceBoolean(value);
    }

    return coerceBoolean(f.poolInGround);
}

/** Handle above-ground pool */
function extractPoolAbove(f: Record<string, unknown>): boolean {
    const pool = f.pool as Record<string, unknown> | undefined;
    if (pool?.["@_type"] === "aboveground") {
        return coerceBoolean(extractText(pool));
    }
    return coerceBoolean(f.poolAboveGround);
}

/**
 * Handle indoor spa.
 * <spa type="inground">no</spa> or <insideSpa>yes</insideSpa>
 */
function extractSpaInside(f: Record<string, unknown>): boolean {
    if (f.insideSpa !== undefined) {
        return coerceBoolean(f.insideSpa);
    }

    const spa = f.spa;
    if (!spa) return false;

    const spaObj = spa as Record<string, unknown>;
    if (spaObj?.["@_type"] === "inground") {
        return coerceBoolean(extractText(spa));
    }

    return coerceBoolean(spa);
}

// ============================================================
// AGENTS
// ============================================================

/** Extract listing agents from <listingAgent> elements */
function extractAgents(raw: Record<string, unknown>): ParsedAgent[] {
    const agentNodes = raw.listingAgent;
    if (!agentNodes) return [];

    const agentArray = Array.isArray(agentNodes) ? agentNodes : [agentNodes];

    return agentArray.map((agent: Record<string, unknown>, idx: number) => {
        const phones = extractPhones(agent.telephone);

        return {
            position: coerceInt(agent["@_id"]) ?? idx + 1,
            name: coerceString(agent.name) ?? "Unknown",
            email: coerceString(agent.email),
            phoneMobile: phones.mobile,
            phoneOffice: phones.office,
            agentIdCode: coerceString(agent["@_id"]),
            twitterUrl: coerceString(agent.twitterURL),
            facebookUrl: coerceString(agent.facebookURL),
            linkedinUrl: coerceString(agent.linkedInURL),
        };
    });
}

/**
 * Extract phone numbers from REAXML telephone elements.
 * Handles single <telephone type="mobile">...</telephone> or arrays.
 */
function extractPhones(tel: unknown): { mobile: string | null; office: string | null } {
    const result = { mobile: null as string | null, office: null as string | null };

    if (!tel) return result;

    const items = Array.isArray(tel) ? tel : [tel];

    for (const item of items) {
        const number = coerceString(extractText(item) ?? item);
        const type = coerceString((item as Record<string, unknown>)?.["@_type"]);

        if (!number) continue;

        switch (type) {
            case "mobile":
                result.mobile = number;
                break;
            case "office":
            case "BH":
                result.office = number;
                break;
            default:
                if (!result.mobile) result.mobile = number;
                else if (!result.office) result.office = number;
                break;
        }
    }

    return result;
}

// ============================================================
// IMAGES
// ============================================================

/** Extract all images, floorplans, and documents from <images> and <objects> */
function extractImages(raw: Record<string, unknown>): ParsedImage[] {
    const imgs: ParsedImage[] = [];
    let sortOrder = 0;

    // Photos: <images><img .../></images>
    const imagesNode = raw.images as Record<string, unknown> | undefined;
    if (imagesNode?.img) {
        const items = Array.isArray(imagesNode.img) ? imagesNode.img : [imagesNode.img];
        for (const img of items) {
            const imgObj = img as Record<string, unknown>;
            const url = coerceString(imgObj["@_url"]);
            if (!url) continue;

            imgs.push({
                type: "photo",
                originalId: coerceString(imgObj["@_id"]),
                url,
                format: coerceString(imgObj["@_format"]),
                modTime: parseReaDate(imgObj["@_modTime"]),
                sortOrder: sortOrder++,
            });
        }
    }

    // Floorplans + documents: <objects><floorplan .../><document .../></objects>
    const objectsNode = raw.objects as Record<string, unknown> | undefined;
    if (objectsNode) {
        if (objectsNode.floorplan) {
            const items = Array.isArray(objectsNode.floorplan) ? objectsNode.floorplan : [objectsNode.floorplan];

            for (const fp of items) {
                const fpObj = fp as Record<string, unknown>;
                const url = coerceString(fpObj["@_url"]);
                if (!url) continue;

                imgs.push({
                    type: "floorplan",
                    originalId: coerceString(fpObj["@_id"]),
                    url,
                    format: coerceString(fpObj["@_format"]),
                    modTime: parseReaDate(fpObj["@_modTime"]),
                    sortOrder: sortOrder++,
                });
            }
        }

        if (objectsNode.document) {
            const items = Array.isArray(objectsNode.document) ? objectsNode.document : [objectsNode.document];

            for (const doc of items) {
                const docObj = doc as Record<string, unknown>;
                const url = coerceString(docObj["@_url"]);
                if (!url) continue;

                imgs.push({
                    type: "document",
                    originalId: coerceString(docObj["@_id"]),
                    url,
                    format: coerceString(docObj["@_format"]),
                    modTime: parseReaDate(docObj["@_modTime"]),
                    sortOrder: sortOrder++,
                });
            }
        }
    }

    return imgs;
}

// ============================================================
// INSPECTIONS
// ============================================================

/** Extract inspection times from <inspectionTimes> */
function extractInspections(raw: Record<string, unknown>): ParsedInspection[] {
    const inspNode = raw.inspectionTimes as Record<string, unknown> | undefined;
    if (!inspNode?.inspection) return [];

    const items = Array.isArray(inspNode.inspection) ? inspNode.inspection : [inspNode.inspection];

    return items.map((insp: unknown) => {
        const description = coerceString(extractText(insp) ?? insp) ?? "";
        const { startsAt, endsAt } = parseInspectionTime(description);
        return { description, startsAt, endsAt };
    });
}

/**
 * Parse inspection time strings like "21-Jan-2009 11:00am to 1:00pm"
 * into start and end Date objects.
 */
function parseInspectionTime(description: string): { startsAt: Date | null; endsAt: Date | null } {
    const match = description.match(
        /^(\d{1,2}-\w{3}-\d{4})\s+(\d{1,2}:\d{2}(?:am|pm))\s+to\s+(\d{1,2}:\d{2}(?:am|pm))$/i,
    );

    if (!match) {
        return { startsAt: null, endsAt: null };
    }

    const [, datePart, startTime, endTime] = match;
    const startsAt = parseDateTimeString(datePart, startTime);
    const endsAt = parseDateTimeString(datePart, endTime);

    return { startsAt, endsAt };
}

const MONTH_MAP: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
};

/** Parse "21-Jan-2009" + "11:00am" into a Date object */
function parseDateTimeString(datePart: string, timePart: string): Date | null {
    try {
        const dateParts = datePart.split("-");
        if (dateParts.length !== 3) return null;

        const day = parseInt(dateParts[0], 10);
        const month = MONTH_MAP[dateParts[1].toLowerCase()];
        const year = parseInt(dateParts[2], 10);

        if (month === undefined || isNaN(day) || isNaN(year)) return null;

        const timeMatch = timePart.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
        if (!timeMatch) return null;

        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const meridiem = timeMatch[3].toLowerCase();

        if (meridiem === "pm" && hours !== 12) hours += 12;
        if (meridiem === "am" && hours === 12) hours = 0;

        return new Date(year, month, day, hours, minutes);
    } catch {
        return null;
    }
}
