/**
 * Agent listing service — handles CRUD operations for authenticated agents.
 * Manages create, update, status change, soft-delete, and agent's own listings.
 */

import { and, eq, sql, desc, asc, type SQL } from "drizzle-orm";
import type { Database } from "$db/connection";
import { listings } from "$db/schema/listings";
import {
    listingAddresses,
    listingFeatures,
    listingImages,
    listingInspections,
    listingAgents,
} from "$db/schema/listing-details";
import { agents } from "$db/schema/organisations";
import type { ListingSummary, PaginatedResponse, PaginationMeta } from "$types/api";

/** Default and maximum page sizes */
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Valid status transitions */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    current: ["withdrawn", "offmarket", "sold", "leased", "deleted"],
    withdrawn: ["current", "deleted"],
    offmarket: ["current", "deleted"],
    sold: ["deleted"],
    leased: ["deleted"],
    deleted: [],
};

// ============================================================
// TYPES
// ============================================================

/** Listing creation input (already validated by Zod) */
export interface CreateListingInput {
    propertyType: string;
    category?: string;
    listingType: string;
    status?: string;
    authority?: string;
    headline?: string;
    description?: string;
    price?: number;
    priceDisplay?: boolean;
    priceView?: string;
    priceTax?: string;
    rentAmount?: number;
    rentPeriod?: string;
    bond?: number;
    dateAvailable?: string;
    commercialRent?: number;
    outgoings?: number;
    returnPercent?: number;
    currentLeaseEnd?: string;
    carSpaces?: number;
    zone?: string;
    furtherOptions?: string;
    landArea?: number;
    landAreaUnit?: string;
    buildingArea?: number;
    buildingAreaUnit?: string;
    frontage?: number;
    energyRating?: number;
    underOffer?: boolean;
    isNewConstruction?: boolean;
    depositTaken?: boolean;
    yearBuilt?: number;
    auctionDate?: string;
    externalLink?: string;
    videoLink?: string;
    address?: AddressInput;
    features?: FeaturesInput;
    images?: ImageInput[];
    inspections?: InspectionInput[];
    agents?: AgentInput[];
}

/** Address input for listing create/update */
export interface AddressInput {
    display?: boolean;
    siteName?: string;
    subNumber?: string;
    lotNumber?: string;
    streetNumber?: string;
    street: string;
    suburb: string;
    state?: string;
    postcode?: string;
    country?: string;
    municipality?: string;
}

/** Features input for listing create/update */
export interface FeaturesInput {
    bedrooms?: number;
    bathrooms?: number;
    ensuites?: number;
    garages?: number;
    carports?: number;
    openSpaces?: number;
    toilets?: number;
    livingAreas?: number;
    airConditioning?: boolean;
    alarmSystem?: boolean;
    balcony?: boolean;
    courtyard?: boolean;
    deck?: boolean;
    fullyFenced?: boolean;
    intercom?: boolean;
    openFireplace?: boolean;
    outdoorEnt?: boolean;
    poolInground?: boolean;
    poolAbove?: boolean;
    remoteGarage?: boolean;
    secureParking?: boolean;
    shed?: boolean;
    spa?: boolean;
    tennisCourt?: boolean;
    vacuumSystem?: boolean;
    heatingType?: string;
    hotWaterType?: string;
    otherFeatures?: string;
    petFriendly?: boolean;
    furnished?: boolean;
    smokersAllowed?: boolean;
}

/** Image input for listing create/update */
export interface ImageInput {
    type: string;
    url: string;
    urlThumb?: string;
    urlMedium?: string;
    urlLarge?: string;
    format?: string;
    title?: string;
    sortOrder?: number;
}

/** Inspection input for listing create/update */
export interface InspectionInput {
    description: string;
    startsAt?: string;
    endsAt?: string;
}

/** Agent input for listing create/update */
export interface AgentInput {
    name: string;
    email?: string;
    phoneMobile?: string;
    phoneOffice?: string;
    position?: number;
}

/** Status change input */
export interface StatusChangeInput {
    status: string;
    soldPrice?: number;
    soldDate?: string;
}

/** Agent's listing search params */
export interface AgentListingParams {
    status?: string;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Normalise pagination params.
 */
function normalisePagination(page?: number, limit?: number): { page: number; limit: number; offset: number } {
    const safePage = Math.max(1, Math.floor(page ?? 1));
    const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(limit ?? DEFAULT_PAGE_SIZE)));
    return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

/**
 * Build pagination metadata.
 */
function buildMeta(total: number, page: number, limit: number): PaginationMeta {
    return {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
    };
}

/**
 * Resolve the agent's agency ID from their user ID.
 * Returns null if the user is not linked to an agent record.
 */
export async function resolveAgencyId(db: Database, userId: string): Promise<string | null> {
    const rows = await db.select({ agencyId: agents.agencyId }).from(agents).where(eq(agents.userId, userId)).limit(1);

    return rows[0]?.agencyId ?? null;
}

/**
 * Format address parts into a single string.
 */
function formatAddress(addr: AddressInput): string {
    const parts: string[] = [];
    if (addr.subNumber) {
        parts.push(`${addr.subNumber}/`);
    }
    if (addr.streetNumber) {
        parts.push(addr.streetNumber);
    }
    parts.push(addr.street);
    const street = parts.join(" ").replace("/ ", "/");

    const locality = [addr.suburb.toUpperCase(), addr.state?.toUpperCase(), addr.postcode].filter(Boolean).join(" ");

    return `${street}, ${locality}`;
}

/**
 * Convert a number to string for Drizzle numeric columns, or null.
 */
function numStr(val?: number): string | null {
    return val !== undefined && val !== null ? String(val) : null;
}

// ============================================================
// CREATE
// ============================================================

/**
 * Create a new listing via JSON input.
 * Returns the created listing ID.
 */
export async function createListing(
    db: Database,
    agencyId: string,
    input: CreateListingInput,
): Promise<{ id: string }> {
    const [inserted] = await db
        .insert(listings)
        .values({
            agencyId,
            crmUniqueId: crypto.randomUUID(),
            crmAgentId: "API",
            propertyType: input.propertyType,
            category: input.category ?? null,
            listingType: input.listingType,
            status: input.status ?? "current",
            authority: input.authority ?? null,
            headline: input.headline ?? null,
            description: input.description ?? null,
            price: numStr(input.price),
            priceDisplay: input.priceDisplay ?? true,
            priceView: input.priceView ?? null,
            priceTax: input.priceTax ?? "unknown",
            rentAmount: numStr(input.rentAmount),
            rentPeriod: input.rentPeriod ?? null,
            bond: numStr(input.bond),
            dateAvailable: input.dateAvailable ? new Date(input.dateAvailable) : null,
            commercialRent: numStr(input.commercialRent),
            outgoings: numStr(input.outgoings),
            returnPercent: numStr(input.returnPercent),
            currentLeaseEnd: input.currentLeaseEnd ? new Date(input.currentLeaseEnd) : null,
            carSpaces: input.carSpaces ?? null,
            zone: input.zone ?? null,
            furtherOptions: input.furtherOptions ?? null,
            landArea: numStr(input.landArea),
            landAreaUnit: input.landAreaUnit ?? null,
            buildingArea: numStr(input.buildingArea),
            buildingAreaUnit: input.buildingAreaUnit ?? null,
            frontage: numStr(input.frontage),
            energyRating: numStr(input.energyRating),
            underOffer: input.underOffer ?? false,
            isNewConstruction: input.isNewConstruction ?? false,
            depositTaken: input.depositTaken ?? false,
            yearBuilt: input.yearBuilt ?? null,
            auctionDate: input.auctionDate ? new Date(input.auctionDate) : null,
            externalLink: input.externalLink ?? null,
            videoLink: input.videoLink ?? null,
        })
        .returning({ id: listings.id });

    const listingId = inserted!.id;

    // Insert related records in parallel
    await insertRelatedRecords(db, listingId, input);

    return { id: listingId };
}

// ============================================================
// UPDATE
// ============================================================

/**
 * Update an existing listing's content.
 * Only updates the listing if it belongs to the agent's agency.
 * Returns true if the listing was found and updated.
 */
export async function updateListing(
    db: Database,
    listingId: string,
    agencyId: string,
    input: CreateListingInput,
): Promise<boolean> {
    // Verify ownership
    const existing = await db
        .select({ id: listings.id })
        .from(listings)
        .where(and(eq(listings.id, listingId), eq(listings.agencyId, agencyId)))
        .limit(1);

    if (existing.length === 0) return false;

    await db
        .update(listings)
        .set({
            propertyType: input.propertyType,
            category: input.category ?? null,
            listingType: input.listingType,
            status: input.status ?? undefined,
            authority: input.authority ?? null,
            headline: input.headline ?? null,
            description: input.description ?? null,
            price: numStr(input.price),
            priceDisplay: input.priceDisplay ?? true,
            priceView: input.priceView ?? null,
            priceTax: input.priceTax ?? "unknown",
            rentAmount: numStr(input.rentAmount),
            rentPeriod: input.rentPeriod ?? null,
            bond: numStr(input.bond),
            dateAvailable: input.dateAvailable ? new Date(input.dateAvailable) : null,
            commercialRent: numStr(input.commercialRent),
            outgoings: numStr(input.outgoings),
            returnPercent: numStr(input.returnPercent),
            currentLeaseEnd: input.currentLeaseEnd ? new Date(input.currentLeaseEnd) : null,
            carSpaces: input.carSpaces ?? null,
            zone: input.zone ?? null,
            furtherOptions: input.furtherOptions ?? null,
            landArea: numStr(input.landArea),
            landAreaUnit: input.landAreaUnit ?? null,
            buildingArea: numStr(input.buildingArea),
            buildingAreaUnit: input.buildingAreaUnit ?? null,
            frontage: numStr(input.frontage),
            energyRating: numStr(input.energyRating),
            underOffer: input.underOffer ?? false,
            isNewConstruction: input.isNewConstruction ?? false,
            depositTaken: input.depositTaken ?? false,
            yearBuilt: input.yearBuilt ?? null,
            auctionDate: input.auctionDate ? new Date(input.auctionDate) : null,
            externalLink: input.externalLink ?? null,
            videoLink: input.videoLink ?? null,
            updatedAt: new Date(),
        })
        .where(eq(listings.id, listingId));

    // Delete and re-insert related records
    await deleteRelatedRecords(db, listingId);
    await insertRelatedRecords(db, listingId, input);

    return true;
}

// ============================================================
// STATUS CHANGE
// ============================================================

/**
 * Change the status of a listing (withdraw, mark sold, etc.).
 * Validates status transitions.
 */
export async function changeListingStatus(
    db: Database,
    listingId: string,
    agencyId: string,
    input: StatusChangeInput,
): Promise<{ success: boolean; error?: string }> {
    // Fetch current listing
    const existing = await db
        .select({ id: listings.id, status: listings.status, agencyId: listings.agencyId })
        .from(listings)
        .where(and(eq(listings.id, listingId), eq(listings.agencyId, agencyId)))
        .limit(1);

    if (existing.length === 0) {
        return { success: false, error: "Listing not found" };
    }

    const currentStatus = existing[0]!.status;
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus];

    if (!allowed || !allowed.includes(input.status)) {
        return {
            success: false,
            error: `Cannot transition from '${currentStatus}' to '${input.status}'`,
        };
    }

    const updateData: Record<string, unknown> = {
        status: input.status,
        updatedAt: new Date(),
    };

    // If marking as sold, include sold details
    if (input.status === "sold") {
        if (input.soldPrice !== undefined) {
            updateData.soldPrice = String(input.soldPrice);
        }
        if (input.soldDate) {
            updateData.soldDate = new Date(input.soldDate);
        }
    }

    await db.update(listings).set(updateData).where(eq(listings.id, listingId));

    return { success: true };
}

// ============================================================
// SOFT DELETE
// ============================================================

/**
 * Soft-delete a listing by setting status to 'deleted' and isPublished to false.
 * Returns true if the listing was found and deleted.
 */
export async function softDeleteListing(db: Database, listingId: string, agencyId: string): Promise<boolean> {
    const result = await db
        .update(listings)
        .set({
            status: "deleted",
            isPublished: false,
            updatedAt: new Date(),
        })
        .where(and(eq(listings.id, listingId), eq(listings.agencyId, agencyId)))
        .returning({ id: listings.id });

    return result.length > 0;
}

// ============================================================
// AGENT'S OWN LISTINGS
// ============================================================

/**
 * Get listings belonging to an agent's agency.
 * Supports filtering by status and pagination.
 */
export async function getAgentListings(
    db: Database,
    agencyId: string,
    params: AgentListingParams,
): Promise<PaginatedResponse<ListingSummary>> {
    const { page, limit, offset } = normalisePagination(params.page, params.limit);

    const conditions: SQL[] = [eq(listings.agencyId, agencyId)];

    if (params.status) {
        conditions.push(eq(listings.status, params.status));
    }

    const where = and(...conditions);

    // Count
    const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .where(where);

    const total = countResult[0]?.count ?? 0;

    // Sort
    const sortDir = params.order === "asc" ? asc : desc;
    let orderBy;
    switch (params.sort) {
        case "price":
            orderBy = sortDir(listings.price);
            break;
        case "status":
            orderBy = sortDir(listings.status);
            break;
        case "date":
        default:
            orderBy = sortDir(listings.createdAt);
            break;
    }

    // Fetch listings with address + features
    const rows = await db
        .select({
            id: listings.id,
            propertyType: listings.propertyType,
            category: listings.category,
            listingType: listings.listingType,
            status: listings.status,
            headline: listings.headline,
            price: listings.price,
            priceDisplay: listings.priceDisplay,
            priceView: listings.priceView,
            rentAmount: listings.rentAmount,
            rentPeriod: listings.rentPeriod,
            landArea: listings.landArea,
            landAreaUnit: listings.landAreaUnit,
            buildingArea: listings.buildingArea,
            buildingAreaUnit: listings.buildingAreaUnit,
            underOffer: listings.underOffer,
            isNewConstruction: listings.isNewConstruction,
            auctionDate: listings.auctionDate,
            createdAt: listings.createdAt,
            addrSuburb: listingAddresses.suburb,
            addrState: listingAddresses.state,
            addrPostcode: listingAddresses.postcode,
            addrFormatted: listingAddresses.formatted,
            bedrooms: listingFeatures.bedrooms,
            bathrooms: listingFeatures.bathrooms,
            garages: listingFeatures.garages,
            carports: listingFeatures.carports,
        })
        .from(listings)
        .leftJoin(listingAddresses, eq(listingAddresses.listingId, listings.id))
        .leftJoin(listingFeatures, eq(listingFeatures.listingId, listings.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

    // Hero images
    const listingIds = rows.map((r) => r.id);
    const heroImages =
        listingIds.length > 0
            ? await db
                  .select({
                      listingId: listingImages.listingId,
                      url: listingImages.url,
                      urlThumb: listingImages.urlThumb,
                  })
                  .from(listingImages)
                  .where(
                      and(
                          sql`${listingImages.listingId} = ANY(${listingIds})`,
                          eq(listingImages.type, "photo"),
                          eq(listingImages.sortOrder, 0),
                      ),
                  )
            : [];

    const heroMap = new Map(heroImages.map((h) => [h.listingId, h]));

    const data: ListingSummary[] = rows.map((row) => {
        const hero = heroMap.get(row.id);
        return {
            id: row.id,
            propertyType: row.propertyType,
            category: row.category,
            listingType: row.listingType,
            status: row.status,
            headline: row.headline,
            price: row.price,
            priceDisplay: row.priceDisplay,
            priceView: row.priceView,
            rentAmount: row.rentAmount,
            rentPeriod: row.rentPeriod,
            landArea: row.landArea,
            landAreaUnit: row.landAreaUnit,
            buildingArea: row.buildingArea,
            buildingAreaUnit: row.buildingAreaUnit,
            underOffer: row.underOffer,
            isNewConstruction: row.isNewConstruction,
            auctionDate: row.auctionDate,
            createdAt: row.createdAt,
            address: row.addrSuburb
                ? {
                      suburb: row.addrSuburb,
                      state: row.addrState,
                      postcode: row.addrPostcode,
                      formatted: row.addrFormatted,
                  }
                : null,
            features:
                row.bedrooms !== null || row.bathrooms !== null || row.garages !== null
                    ? {
                          bedrooms: row.bedrooms,
                          bathrooms: row.bathrooms,
                          garages: row.garages,
                          carports: row.carports,
                      }
                    : null,
            heroImage: hero ? { url: hero.url, urlThumb: hero.urlThumb } : null,
        };
    });

    return { data, meta: buildMeta(total, page, limit) };
}

// ============================================================
// RELATED RECORD HELPERS
// ============================================================

/**
 * Insert all related records for a listing.
 */
async function insertRelatedRecords(db: Database, listingId: string, input: CreateListingInput): Promise<void> {
    const promises: Promise<unknown>[] = [];

    if (input.address) {
        const formatted = formatAddress(input.address);
        promises.push(
            db.insert(listingAddresses).values({
                listingId,
                display: input.address.display ?? true,
                siteName: input.address.siteName ?? null,
                subNumber: input.address.subNumber ?? null,
                lotNumber: input.address.lotNumber ?? null,
                streetNumber: input.address.streetNumber ?? null,
                street: input.address.street,
                suburb: input.address.suburb,
                state: input.address.state ?? null,
                postcode: input.address.postcode ?? null,
                country: input.address.country ?? "AUS",
                municipality: input.address.municipality ?? null,
                formatted,
            }),
        );
    }

    if (input.features) {
        promises.push(
            db.insert(listingFeatures).values({
                listingId,
                ...input.features,
            }),
        );
    }

    if (input.images && input.images.length > 0) {
        promises.push(
            db.insert(listingImages).values(
                input.images.map((img, idx) => ({
                    listingId,
                    type: img.type,
                    url: img.url,
                    urlThumb: img.urlThumb ?? null,
                    urlMedium: img.urlMedium ?? null,
                    urlLarge: img.urlLarge ?? null,
                    format: img.format ?? null,
                    title: img.title ?? null,
                    sortOrder: img.sortOrder ?? idx,
                })),
            ),
        );
    }

    if (input.inspections && input.inspections.length > 0) {
        promises.push(
            db.insert(listingInspections).values(
                input.inspections.map((insp) => ({
                    listingId,
                    description: insp.description,
                    startsAt: insp.startsAt ? new Date(insp.startsAt) : null,
                    endsAt: insp.endsAt ? new Date(insp.endsAt) : null,
                })),
            ),
        );
    }

    if (input.agents && input.agents.length > 0) {
        promises.push(
            db.insert(listingAgents).values(
                input.agents.map((agent, idx) => ({
                    listingId,
                    name: agent.name,
                    email: agent.email ?? null,
                    phoneMobile: agent.phoneMobile ?? null,
                    phoneOffice: agent.phoneOffice ?? null,
                    position: agent.position ?? idx + 1,
                })),
            ),
        );
    }

    await Promise.all(promises);
}

/**
 * Delete all related records for a listing (before re-insertion on update).
 */
async function deleteRelatedRecords(db: Database, listingId: string): Promise<void> {
    await Promise.all([
        db.delete(listingAddresses).where(eq(listingAddresses.listingId, listingId)),
        db.delete(listingFeatures).where(eq(listingFeatures.listingId, listingId)),
        db.delete(listingImages).where(eq(listingImages.listingId, listingId)),
        db.delete(listingInspections).where(eq(listingInspections.listingId, listingId)),
        db.delete(listingAgents).where(eq(listingAgents.listingId, listingId)),
    ]);
}
