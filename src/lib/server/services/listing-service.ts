/**
 * Listing query service — handles search, filtering, pagination, and detail reads.
 * All public (consumer-facing) listing queries live here.
 */

import { and, eq, gte, lte, ilike, sql, asc, desc, type SQL } from "drizzle-orm";
import type { Database } from "$db/connection";
import { listings } from "$db/schema/listings";
import {
    listingAddresses,
    listingFeatures,
    listingImages,
    listingInspections,
    listingAgents,
} from "$db/schema/listing-details";
import { agencies } from "$db/schema/organisations";
import type {
    ListingSearchParams,
    NearbySearchParams,
    ListingSummary,
    ListingDetail,
    SuburbResult,
    PaginatedResponse,
    PaginationMeta,
} from "$types/api";

/** Default and maximum page sizes */
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_NEARBY_RADIUS_KM = 5;
const MAX_NEARBY_RADIUS_KM = 50;

/**
 * Normalise pagination params to safe values.
 */
function normalisePagination(page?: number, limit?: number): { page: number; limit: number; offset: number } {
    const safePage = Math.max(1, Math.floor(page ?? 1));
    const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(limit ?? DEFAULT_PAGE_SIZE)));
    return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

/**
 * Build pagination metadata from total count and current pagination.
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
 * Search and filter listings with pagination.
 * Returns summary-level data suitable for list/card views.
 */
export async function searchListings(
    db: Database,
    params: ListingSearchParams,
): Promise<PaginatedResponse<ListingSummary>> {
    const { page, limit, offset } = normalisePagination(params.page, params.limit);

    // Build WHERE conditions
    const conditions: SQL[] = [eq(listings.isPublished, true), eq(listings.status, "current")];

    if (params.propertyType) {
        conditions.push(eq(listings.propertyType, params.propertyType));
    }

    if (params.listingType) {
        conditions.push(eq(listings.listingType, params.listingType));
    }

    if (params.priceMin !== undefined) {
        conditions.push(gte(listings.price, String(params.priceMin)));
    }

    if (params.priceMax !== undefined) {
        conditions.push(lte(listings.price, String(params.priceMax)));
    }

    if (params.suburb) {
        conditions.push(ilike(listingAddresses.suburb, params.suburb));
    }

    if (params.postcode) {
        conditions.push(eq(listingAddresses.postcode, params.postcode));
    }

    if (params.state) {
        conditions.push(ilike(listingAddresses.state, params.state));
    }

    if (params.bedsMin !== undefined) {
        conditions.push(gte(listingFeatures.bedrooms, params.bedsMin));
    }

    if (params.bathsMin !== undefined) {
        conditions.push(gte(listingFeatures.bathrooms, params.bathsMin));
    }

    if (params.carsMin !== undefined) {
        conditions.push(
            gte(
                sql`COALESCE(${listingFeatures.garages}, 0) + COALESCE(${listingFeatures.carports}, 0)`,
                params.carsMin,
            ),
        );
    }

    // Full-text search on headline + description
    if (params.q) {
        conditions.push(sql`${listings.searchVector} @@ plainto_tsquery('english', ${params.q})`);
    }

    const where = and(...conditions);

    // Count total matching rows
    const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .leftJoin(listingAddresses, eq(listingAddresses.listingId, listings.id))
        .leftJoin(listingFeatures, eq(listingFeatures.listingId, listings.id))
        .where(where);

    const total = countResult[0]?.count ?? 0;

    // Determine sort order
    const orderBy = buildSortOrder(params.sort, params.order, params.q);

    // Fetch listing rows with address + features join
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
            // Address fields
            addrSuburb: listingAddresses.suburb,
            addrState: listingAddresses.state,
            addrPostcode: listingAddresses.postcode,
            addrFormatted: listingAddresses.formatted,
            // Feature fields
            bedrooms: listingFeatures.bedrooms,
            bathrooms: listingFeatures.bathrooms,
            garages: listingFeatures.garages,
            carports: listingFeatures.carports,
        })
        .from(listings)
        .leftJoin(listingAddresses, eq(listingAddresses.listingId, listings.id))
        .leftJoin(listingFeatures, eq(listingFeatures.listingId, listings.id))
        .where(where)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset);

    // Fetch hero images for all listings in one query
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

    // Map to ListingSummary
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

/**
 * Get a single listing by ID with all related data.
 * Returns null if listing not found or not published.
 */
export async function getListingById(db: Database, id: string): Promise<ListingDetail | null> {
    // Fetch listing with address, features, and agency in one query
    const rows = await db
        .select({
            // Listing fields
            id: listings.id,
            propertyType: listings.propertyType,
            category: listings.category,
            listingType: listings.listingType,
            status: listings.status,
            headline: listings.headline,
            description: listings.description,
            authority: listings.authority,
            price: listings.price,
            priceDisplay: listings.priceDisplay,
            priceView: listings.priceView,
            priceTax: listings.priceTax,
            rentAmount: listings.rentAmount,
            rentPeriod: listings.rentPeriod,
            rentDisplay: listings.rentDisplay,
            bond: listings.bond,
            dateAvailable: listings.dateAvailable,
            commercialRent: listings.commercialRent,
            outgoings: listings.outgoings,
            returnPercent: listings.returnPercent,
            currentLeaseEnd: listings.currentLeaseEnd,
            carSpaces: listings.carSpaces,
            zone: listings.zone,
            furtherOptions: listings.furtherOptions,
            landArea: listings.landArea,
            landAreaUnit: listings.landAreaUnit,
            buildingArea: listings.buildingArea,
            buildingAreaUnit: listings.buildingAreaUnit,
            frontage: listings.frontage,
            energyRating: listings.energyRating,
            underOffer: listings.underOffer,
            isNewConstruction: listings.isNewConstruction,
            depositTaken: listings.depositTaken,
            yearBuilt: listings.yearBuilt,
            yearRenovated: listings.yearRenovated,
            auctionDate: listings.auctionDate,
            soldPrice: listings.soldPrice,
            soldPriceDisplay: listings.soldPriceDisplay,
            soldDate: listings.soldDate,
            externalLink: listings.externalLink,
            videoLink: listings.videoLink,
            ruralFeatures: listings.ruralFeatures,
            ecoFeatures: listings.ecoFeatures,
            modTime: listings.modTime,
            createdAt: listings.createdAt,
            // Address
            addrSuburb: listingAddresses.suburb,
            addrState: listingAddresses.state,
            addrPostcode: listingAddresses.postcode,
            addrFormatted: listingAddresses.formatted,
            // Agency
            agencyId: agencies.id,
            agencyName: agencies.name,
            agencyPhone: agencies.phone,
            agencyEmail: agencies.email,
            agencyLogo: agencies.logoUrl,
        })
        .from(listings)
        .leftJoin(listingAddresses, eq(listingAddresses.listingId, listings.id))
        .leftJoin(agencies, eq(agencies.id, listings.agencyId))
        .where(and(eq(listings.id, id), eq(listings.isPublished, true)))
        .limit(1);

    const row = rows[0];
    if (!row) return null;

    // Fetch related data in parallel
    const [featuresRows, imagesRows, inspectionsRows, agentsRows] = await Promise.all([
        db.select().from(listingFeatures).where(eq(listingFeatures.listingId, id)).limit(1),
        db
            .select({
                id: listingImages.id,
                type: listingImages.type,
                sortOrder: listingImages.sortOrder,
                url: listingImages.url,
                urlThumb: listingImages.urlThumb,
                urlMedium: listingImages.urlMedium,
                urlLarge: listingImages.urlLarge,
                format: listingImages.format,
                title: listingImages.title,
            })
            .from(listingImages)
            .where(eq(listingImages.listingId, id))
            .orderBy(asc(listingImages.sortOrder)),
        db
            .select({
                id: listingInspections.id,
                description: listingInspections.description,
                startsAt: listingInspections.startsAt,
                endsAt: listingInspections.endsAt,
            })
            .from(listingInspections)
            .where(eq(listingInspections.listingId, id))
            .orderBy(asc(listingInspections.startsAt)),
        db
            .select({
                name: listingAgents.name,
                email: listingAgents.email,
                phoneMobile: listingAgents.phoneMobile,
                phoneOffice: listingAgents.phoneOffice,
                position: listingAgents.position,
            })
            .from(listingAgents)
            .where(eq(listingAgents.listingId, id))
            .orderBy(asc(listingAgents.position)),
    ]);

    // Increment view count asynchronously (fire-and-forget)
    db.update(listings)
        .set({ viewCount: sql`${listings.viewCount} + 1` })
        .where(eq(listings.id, id))
        .then(() => {})
        .catch(() => {});

    const feat = featuresRows[0] ?? null;
    const photos = imagesRows.filter((i) => i.type === "photo");
    const heroImage = photos[0] ? { url: photos[0].url, urlThumb: photos[0].urlThumb } : null;

    return {
        id: row.id,
        propertyType: row.propertyType,
        category: row.category,
        listingType: row.listingType,
        status: row.status,
        headline: row.headline,
        description: row.description,
        authority: row.authority,
        price: row.price,
        priceDisplay: row.priceDisplay,
        priceView: row.priceView,
        priceTax: row.priceTax,
        rentAmount: row.rentAmount,
        rentPeriod: row.rentPeriod,
        rentDisplay: row.rentDisplay,
        bond: row.bond,
        dateAvailable: row.dateAvailable,
        commercialRent: row.commercialRent,
        outgoings: row.outgoings,
        returnPercent: row.returnPercent,
        currentLeaseEnd: row.currentLeaseEnd,
        carSpaces: row.carSpaces,
        zone: row.zone,
        furtherOptions: row.furtherOptions,
        landArea: row.landArea,
        landAreaUnit: row.landAreaUnit,
        buildingArea: row.buildingArea,
        buildingAreaUnit: row.buildingAreaUnit,
        frontage: row.frontage,
        energyRating: row.energyRating,
        underOffer: row.underOffer,
        isNewConstruction: row.isNewConstruction,
        depositTaken: row.depositTaken,
        yearBuilt: row.yearBuilt,
        yearRenovated: row.yearRenovated,
        auctionDate: row.auctionDate,
        soldPrice: row.soldPrice,
        soldPriceDisplay: row.soldPriceDisplay,
        soldDate: row.soldDate,
        externalLink: row.externalLink,
        videoLink: row.videoLink,
        ruralFeatures: row.ruralFeatures,
        ecoFeatures: row.ecoFeatures,
        modTime: row.modTime,
        createdAt: row.createdAt,
        address: row.addrSuburb
            ? {
                  suburb: row.addrSuburb,
                  state: row.addrState,
                  postcode: row.addrPostcode,
                  formatted: row.addrFormatted,
              }
            : null,
        features: feat
            ? {
                  bedrooms: feat.bedrooms,
                  bathrooms: feat.bathrooms,
                  garages: feat.garages,
                  carports: feat.carports,
              }
            : null,
        heroImage,
        allFeatures: feat
            ? {
                  bedrooms: feat.bedrooms,
                  bathrooms: feat.bathrooms,
                  ensuites: feat.ensuites,
                  garages: feat.garages,
                  carports: feat.carports,
                  openSpaces: feat.openSpaces,
                  toilets: feat.toilets,
                  livingAreas: feat.livingAreas,
                  airConditioning: feat.airConditioning,
                  alarmSystem: feat.alarmSystem,
                  balcony: feat.balcony,
                  courtyard: feat.courtyard,
                  deck: feat.deck,
                  fullyFenced: feat.fullyFenced,
                  intercom: feat.intercom,
                  openFireplace: feat.openFireplace,
                  outdoorEnt: feat.outdoorEnt,
                  poolInground: feat.poolInground,
                  poolAbove: feat.poolAbove,
                  remoteGarage: feat.remoteGarage,
                  secureParking: feat.secureParking,
                  shed: feat.shed,
                  spa: feat.spa,
                  tennisCourt: feat.tennisCourt,
                  vacuumSystem: feat.vacuumSystem,
                  heatingType: feat.heatingType,
                  hotWaterType: feat.hotWaterType,
                  otherFeatures: feat.otherFeatures,
                  petFriendly: feat.petFriendly,
                  furnished: feat.furnished,
                  smokersAllowed: feat.smokersAllowed,
              }
            : null,
        images: imagesRows,
        inspections: inspectionsRows,
        agents: agentsRows,
        agency: row.agencyId
            ? {
                  id: row.agencyId,
                  name: row.agencyName!,
                  phone: row.agencyPhone,
                  email: row.agencyEmail,
                  logoUrl: row.agencyLogo,
              }
            : null,
    };
}

/**
 * Find listings near a geographic point using PostGIS ST_DWithin.
 * Returns summary-level data sorted by distance.
 *
 * @deprecated PostGIS dependency removed. Re-enable when PostGIS is available.
 * TODO: Implement Haversine formula for basic distance calculation or re-enable PostGIS.
 */
export async function searchNearby(
    db: Database,
    params: NearbySearchParams,
): Promise<PaginatedResponse<ListingSummary & { distanceKm: number }>> {
    throw new Error("Nearby search requires PostGIS extension. Feature temporarily disabled.");

    /* PostGIS implementation - uncomment when PostGIS is re-enabled:
    const radiusKm = Math.min(params.radiusKm ?? DEFAULT_NEARBY_RADIUS_KM, MAX_NEARBY_RADIUS_KM);
    const radiusMetres = radiusKm * 1000;
    const { page, limit, offset } = normalisePagination(params.page, params.limit);

    const point = sql`ST_SetSRID(ST_MakePoint(${params.lng}, ${params.lat}), 4326)::geography`;

    const conditions: SQL[] = [
        eq(listings.isPublished, true),
        eq(listings.status, "current"),
        sql`ST_DWithin(${listingAddresses.location}, ${point}, ${radiusMetres})`,
    ];

    if (params.propertyType) {
        conditions.push(eq(listings.propertyType, params.propertyType));
    }

    if (params.listingType) {
        conditions.push(eq(listings.listingType, params.listingType));
    }

    const where = and(...conditions);

    const distanceExpr = sql<number>`round((ST_Distance(${listingAddresses.location}, ${point}) / 1000)::numeric, 2)`;
    */

    /* Count and fetch implementation - uncomment when PostGIS is re-enabled:
    // Count
    const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .innerJoin(listingAddresses, eq(listingAddresses.listingId, listings.id))
        .where(where);

    const total = countResult[0]?.count ?? 0;

    // Fetch rows
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
            distanceKm: distanceExpr,
        })
        .from(listings)
        .innerJoin(listingAddresses, eq(listingAddresses.listingId, listings.id))
        .where(where)
        .orderBy(asc(distanceExpr))
        .limit(limit)
        .offset(offset);

    // Fetch features and hero images
    const listingIds = rows.map((r) => r.id);
    const [featureRows, heroImages] =
        listingIds.length > 0
            ? await Promise.all([
                  db
                      .select({
                          listingId: listingFeatures.listingId,
                          bedrooms: listingFeatures.bedrooms,
                          bathrooms: listingFeatures.bathrooms,
                          garages: listingFeatures.garages,
                          carports: listingFeatures.carports,
                      })
                      .from(listingFeatures)
                      .where(sql`${listingFeatures.listingId} = ANY(${listingIds})`),
                  db
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
                      ),
              ])
            : [[], []];

    const featMap = new Map(featureRows.map((f) => [f.listingId, f]));
    const heroMap = new Map(heroImages.map((h) => [h.listingId, h]));

    const data = rows.map((row) => {
        const feat = featMap.get(row.id);
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
            distanceKm: row.distanceKm,
            address: {
                suburb: row.addrSuburb,
                state: row.addrState,
                postcode: row.addrPostcode,
                formatted: row.addrFormatted,
            },
            features: feat
                ? {
                      bedrooms: feat.bedrooms,
                      bathrooms: feat.bathrooms,
                      garages: feat.garages,
                      carports: feat.carports,
                  }
                : null,
            heroImage: hero ? { url: hero.url, urlThumb: hero.urlThumb } : null,
        };
    });

    return { data, meta: buildMeta(total, page, limit) };
    */
}

/**
 * Suburb autocomplete search.
 * Attempts pg_trgm similarity for fuzzy matching; falls back to ILIKE
 * if the extension is not available.
 * Returns distinct suburb/state/postcode tuples matching the query.
 */
export async function searchSuburbs(db: Database, query: string, limit: number = 10): Promise<SuburbResult[]> {
    const safeLimit = Math.min(Math.max(1, limit), 50);

    if (!query || query.trim().length < 2) {
        return [];
    }

    const trimmed = query.trim();

    let results: { suburb: string; state: string | null; postcode: string | null }[];

    try {
        // Prefer pg_trgm similarity + ILIKE for fuzzy matching
        results = await db
            .selectDistinct({
                suburb: listingAddresses.suburb,
                state: listingAddresses.state,
                postcode: listingAddresses.postcode,
            })
            .from(listingAddresses)
            .where(
                sql`(
                    ${listingAddresses.suburb} ILIKE ${`%${trimmed}%`}
                    OR ${listingAddresses.postcode} = ${trimmed}
                    OR similarity(${listingAddresses.suburb}, ${trimmed}) > 0.3
                )`,
            )
            .orderBy(sql`similarity(${listingAddresses.suburb}, ${trimmed}) DESC`)
            .limit(safeLimit);
    } catch {
        // Fallback: pg_trgm extension not available — use ILIKE only
        results = await db
            .selectDistinct({
                suburb: listingAddresses.suburb,
                state: listingAddresses.state,
                postcode: listingAddresses.postcode,
            })
            .from(listingAddresses)
            .where(
                sql`(
                    ${listingAddresses.suburb} ILIKE ${`%${trimmed}%`}
                    OR ${listingAddresses.postcode} = ${trimmed}
                )`,
            )
            .orderBy(listingAddresses.suburb)
            .limit(safeLimit);
    }

    // Filter out null state/postcode for type safety
    return results
        .filter(
            (r): r is { suburb: string; state: string; postcode: string } => r.state !== null && r.postcode !== null,
        )
        .map((r) => ({
            suburb: r.suburb,
            state: r.state,
            postcode: r.postcode,
        }));
}

/**
 * Build sort clause for listing search.
 */
function buildSortOrder(sort?: string, order?: string, hasQuery?: string): SQL[] {
    const dir = order === "asc" ? asc : desc;

    switch (sort) {
        case "price":
            return [dir(listings.price)];
        case "date":
            return [dir(listings.createdAt)];
        case "relevance":
            if (hasQuery) {
                return [
                    sql`ts_rank(${listings.searchVector}, plainto_tsquery('english', ${hasQuery})) DESC`,
                    desc(listings.createdAt),
                ];
            }
            return [desc(listings.createdAt)];
        default:
            // Default: newest first
            return [desc(listings.createdAt)];
    }
}
