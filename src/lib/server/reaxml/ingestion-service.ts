/**
 * REAXML ingestion service — orchestrates the full pipeline:
 * parse XML → validate → resolve agency → map → upsert to database.
 *
 * Designed with dependency injection for testability:
 * the database instance is passed as a parameter.
 */

import { eq, and } from "drizzle-orm";
import type { Database } from "../db/connection";
import {
    listings,
    listingAddresses,
    listingFeatures,
    listingImages,
    listingInspections,
    listingAgents,
    agencies,
} from "../db/schema";
import { parseReaxml } from "./parser";
import { validateListing } from "./validator";
import { mapListingToDb } from "./mapper";
import type { ParsedListing, IngestionResult, IngestionReport } from "./types";

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Ingest a REAXML property list XML string.
 * Parses, validates, and upserts all listings in the document.
 *
 * @param xml - Raw REAXML XML string
 * @param db - Drizzle database instance
 * @returns Ingestion report with per-listing results
 */
export async function ingestReaxml(xml: string, db: Database): Promise<IngestionReport> {
    // 1. Parse XML into normalised listings
    let parsedListings: ParsedListing[];
    try {
        parsedListings = parseReaxml(xml);
    } catch (error) {
        return {
            totalProcessed: 0,
            successful: 0,
            failed: 1,
            results: [
                {
                    agentId: "unknown",
                    uniqueId: "unknown",
                    propertyType: "unknown",
                    status: "unknown",
                    success: false,
                    action: "skipped",
                    error: error instanceof Error ? error.message : "Failed to parse XML",
                },
            ],
        };
    }

    const results: IngestionResult[] = [];

    // 2. Process each listing individually
    for (const parsed of parsedListings) {
        const result = await processListing(parsed, db);
        results.push(result);
    }

    const successful = results.filter((r) => r.success).length;

    return {
        totalProcessed: results.length,
        successful,
        failed: results.length - successful,
        results,
    };
}

// ============================================================
// INTERNAL
// ============================================================

/**
 * Process a single parsed listing through validation, agency resolution, and upsert.
 */
async function processListing(parsed: ParsedListing, db: Database): Promise<IngestionResult> {
    const baseResult = {
        agentId: parsed.agentId,
        uniqueId: parsed.uniqueId,
        propertyType: parsed.propertyType,
        status: parsed.status,
    };

    // 1. Validate
    const validation = validateListing(parsed);
    if (!validation.valid) {
        const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`).join("; ");

        return {
            ...baseResult,
            success: false,
            action: "skipped",
            error: `Validation failed: ${errorMessages}`,
            details: Object.fromEntries(validation.errors.map((e) => [e.field, e.message])),
        };
    }

    // 2. Resolve agency by agentIdCode (REAXML <agentID>)
    const agency = await db
        .select({ id: agencies.id })
        .from(agencies)
        .where(eq(agencies.agentIdCode, parsed.agentId))
        .limit(1);

    if (agency.length === 0) {
        return {
            ...baseResult,
            success: false,
            action: "skipped",
            error: `Unknown agency code: ${parsed.agentId}. ` + "Agency must be registered before importing listings.",
        };
    }

    const agencyId = agency[0]!.id;

    // 3. Check for existing listing (upsert key: crm_agent_id + crm_unique_id)
    const existing = await db
        .select({ id: listings.id, status: listings.status })
        .from(listings)
        .where(and(eq(listings.crmAgentId, parsed.agentId), eq(listings.crmUniqueId, parsed.uniqueId)))
        .limit(1);

    try {
        if (existing.length > 0) {
            // Update existing listing
            return await updateListing(parsed, agencyId, existing[0]!.id, existing[0]!.status, db);
        } else {
            // Create new listing
            return await createListing(parsed, agencyId, db);
        }
    } catch (error) {
        return {
            ...baseResult,
            success: false,
            action: "skipped",
            error: error instanceof Error ? error.message : "Database operation failed",
        };
    }
}

/**
 * Create a new listing with all related records in a single transaction.
 */
async function createListing(parsed: ParsedListing, agencyId: string, db: Database): Promise<IngestionResult> {
    const baseResult = {
        agentId: parsed.agentId,
        uniqueId: parsed.uniqueId,
        propertyType: parsed.propertyType,
        status: parsed.status,
    };

    // Insert listing and get the generated ID
    const [inserted] = await db
        .insert(listings)
        .values({
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
            price: parsed.price !== null ? String(parsed.price) : null,
            priceDisplay: parsed.priceDisplay,
            priceView: parsed.priceView,
            priceTax: parsed.priceTax,
            rentAmount: parsed.rentAmount !== null ? String(parsed.rentAmount) : null,
            rentPeriod: parsed.rentPeriod,
            rentDisplay: parsed.rentDisplay,
            bond: parsed.bond !== null ? String(parsed.bond) : null,
            dateAvailable: parsed.dateAvailable,
            commercialRent: parsed.commercialRent !== null ? String(parsed.commercialRent) : null,
            outgoings: parsed.outgoings !== null ? String(parsed.outgoings) : null,
            returnPercent: parsed.returnPercent !== null ? String(parsed.returnPercent) : null,
            currentLeaseEnd: parsed.currentLeaseEnd,
            tenancy: parsed.tenancy,
            propertyExtent: parsed.propertyExtent,
            carSpaces: parsed.carSpaces,
            zone: parsed.zone,
            furtherOptions: parsed.furtherOptions,
            landArea: parsed.landArea !== null ? String(parsed.landArea) : null,
            landAreaUnit: parsed.landAreaUnit,
            buildingArea: parsed.buildingArea !== null ? String(parsed.buildingArea) : null,
            buildingAreaUnit: parsed.buildingAreaUnit,
            frontage: parsed.frontage !== null ? String(parsed.frontage) : null,
            energyRating: parsed.energyRating !== null ? String(parsed.energyRating) : null,
            underOffer: parsed.underOffer,
            isNewConstruction: parsed.isNewConstruction,
            isHomeLandPackage: parsed.isHomeLandPackage,
            depositTaken: parsed.depositTaken,
            yearBuilt: parsed.yearBuilt,
            yearRenovated: parsed.yearRenovated,
            auctionDate: parsed.auctionDate,
            soldPrice:
                parsed.soldDetails?.price !== null && parsed.soldDetails?.price !== undefined
                    ? String(parsed.soldDetails.price)
                    : null,
            soldPriceDisplay: parsed.soldDetails?.priceDisplay ?? null,
            soldDate: parsed.soldDetails?.date ?? null,
            externalLink: parsed.externalLink,
            videoLink: parsed.videoLink,
            ruralFeatures: parsed.ruralFeatures,
            modTime: parsed.modTime,
        })
        .returning({ id: listings.id });

    const listingId = inserted!.id;
    const mapped = mapListingToDb(parsed, agencyId, listingId);

    // Insert related records
    await insertRelatedRecords(mapped, db);

    return { ...baseResult, success: true, action: "created" };
}

/**
 * Update an existing listing and its related records.
 */
async function updateListing(
    parsed: ParsedListing,
    agencyId: string,
    existingId: string,
    existingStatus: string,
    db: Database,
): Promise<IngestionResult> {
    const baseResult = {
        agentId: parsed.agentId,
        uniqueId: parsed.uniqueId,
        propertyType: parsed.propertyType,
        status: parsed.status,
    };

    // Determine if this is just a status change (sold, withdrawn, etc.)
    const isStatusChangeOnly =
        parsed.status !== "current" && !parsed.headline && !parsed.description && !parsed.address;

    if (isStatusChangeOnly) {
        await db
            .update(listings)
            .set({
                status: parsed.status,
                modTime: parsed.modTime,
                soldPrice:
                    parsed.soldDetails?.price !== null && parsed.soldDetails?.price !== undefined
                        ? String(parsed.soldDetails.price)
                        : undefined,
                soldPriceDisplay: parsed.soldDetails?.priceDisplay ?? undefined,
                soldDate: parsed.soldDetails?.date ?? undefined,
                updatedAt: new Date(),
            })
            .where(eq(listings.id, existingId));

        return {
            ...baseResult,
            success: true,
            action: existingStatus !== parsed.status ? "status_changed" : "updated",
        };
    }

    // Full update
    await db
        .update(listings)
        .set({
            agencyId,
            propertyType: parsed.propertyType,
            category: parsed.category,
            listingType: parsed.listingType,
            status: parsed.status,
            authority: parsed.authority,
            headline: parsed.headline,
            description: parsed.description,
            price: parsed.price !== null ? String(parsed.price) : null,
            priceDisplay: parsed.priceDisplay,
            priceView: parsed.priceView,
            priceTax: parsed.priceTax,
            rentAmount: parsed.rentAmount !== null ? String(parsed.rentAmount) : null,
            rentPeriod: parsed.rentPeriod,
            rentDisplay: parsed.rentDisplay,
            bond: parsed.bond !== null ? String(parsed.bond) : null,
            dateAvailable: parsed.dateAvailable,
            commercialRent: parsed.commercialRent !== null ? String(parsed.commercialRent) : null,
            outgoings: parsed.outgoings !== null ? String(parsed.outgoings) : null,
            returnPercent: parsed.returnPercent !== null ? String(parsed.returnPercent) : null,
            currentLeaseEnd: parsed.currentLeaseEnd,
            tenancy: parsed.tenancy,
            propertyExtent: parsed.propertyExtent,
            carSpaces: parsed.carSpaces,
            zone: parsed.zone,
            furtherOptions: parsed.furtherOptions,
            landArea: parsed.landArea !== null ? String(parsed.landArea) : null,
            landAreaUnit: parsed.landAreaUnit,
            buildingArea: parsed.buildingArea !== null ? String(parsed.buildingArea) : null,
            buildingAreaUnit: parsed.buildingAreaUnit,
            frontage: parsed.frontage !== null ? String(parsed.frontage) : null,
            energyRating: parsed.energyRating !== null ? String(parsed.energyRating) : null,
            underOffer: parsed.underOffer,
            isNewConstruction: parsed.isNewConstruction,
            isHomeLandPackage: parsed.isHomeLandPackage,
            depositTaken: parsed.depositTaken,
            yearBuilt: parsed.yearBuilt,
            yearRenovated: parsed.yearRenovated,
            auctionDate: parsed.auctionDate,
            soldPrice:
                parsed.soldDetails?.price !== null && parsed.soldDetails?.price !== undefined
                    ? String(parsed.soldDetails.price)
                    : null,
            soldPriceDisplay: parsed.soldDetails?.priceDisplay ?? null,
            soldDate: parsed.soldDetails?.date ?? null,
            externalLink: parsed.externalLink,
            videoLink: parsed.videoLink,
            ruralFeatures: parsed.ruralFeatures,
            modTime: parsed.modTime,
            updatedAt: new Date(),
        })
        .where(eq(listings.id, existingId));

    // Delete and re-insert related records
    await deleteRelatedRecords(existingId, db);

    const mapped = mapListingToDb(parsed, agencyId, existingId);
    await insertRelatedRecords(mapped, db);

    return { ...baseResult, success: true, action: "updated" };
}

/**
 * Insert all related records (address, features, images, inspections, agents).
 */
async function insertRelatedRecords(mapped: ReturnType<typeof mapListingToDb>, db: Database): Promise<void> {
    const promises: Promise<unknown>[] = [];

    if (mapped.address) {
        promises.push(db.insert(listingAddresses).values(mapped.address));
    }

    if (mapped.features) {
        promises.push(db.insert(listingFeatures).values(mapped.features as typeof listingFeatures.$inferInsert));
    }

    if (mapped.images.length > 0) {
        promises.push(db.insert(listingImages).values(mapped.images));
    }

    if (mapped.inspections.length > 0) {
        promises.push(db.insert(listingInspections).values(mapped.inspections));
    }

    if (mapped.agents.length > 0) {
        promises.push(db.insert(listingAgents).values(mapped.agents));
    }

    await Promise.all(promises);
}

/**
 * Delete all related records for a listing (before re-insertion on update).
 */
async function deleteRelatedRecords(listingId: string, db: Database): Promise<void> {
    await Promise.all([
        db.delete(listingAddresses).where(eq(listingAddresses.listingId, listingId)),
        db.delete(listingFeatures).where(eq(listingFeatures.listingId, listingId)),
        db.delete(listingImages).where(eq(listingImages.listingId, listingId)),
        db.delete(listingInspections).where(eq(listingInspections.listingId, listingId)),
        db.delete(listingAgents).where(eq(listingAgents.listingId, listingId)),
    ]);
}
