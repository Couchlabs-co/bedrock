/**
 * Listings table — core listing data unified across all property types.
 * Maps to REAXML residential, rental, commercial, land, rural, and holidayRental.
 */

import {
    pgTable,
    uuid,
    text,
    boolean,
    timestamp,
    numeric,
    integer,
    jsonb,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { agencies } from "./organisations";
import { properties, addresses } from "./properties";
import { tsvector } from "./custom-types";

/** Listings — unified property listing table */
export const listings = pgTable(
    "listings",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        propertyId: uuid("property_id").references(() => properties.id, { onDelete: "restrict" }),
        listingAddressId: uuid("listing_address_id").references(() => addresses.id, { onDelete: "restrict" }),
        agencyId: uuid("agency_id")
            .notNull()
            .references(() => agencies.id),

        // External system identifiers (for deduplication)
        externalListingId: text("external_listing_id").notNull(),
        crmAgentId: text("crm_agent_id").notNull(),

        // Classification
        propertyType: text("property_type").notNull(), // residential, rental, commercial, land, rural, holidayRental
        category: text("category"), // House, Unit, Apartment, etc.
        listingType: text("listing_type").notNull(), // sale, rent, lease, roomshare, holiday_rental
        status: text("status").notNull().default("draft"), // draft, published, under_offer, sold, leased, archived, withdrawn
        authority: text("authority"), // exclusive, auction, open, etc.

        // Content
        headline: text("headline"),
        description: text("description"),

        // Pricing
        price: numeric("price"),
        priceDisplay: boolean("price_display").default(true),
        priceView: text("price_view"),
        priceTax: text("price_tax").default("unknown"),
        priceMin: numeric("price_min"),
        priceMax: numeric("price_max"),

        // Rental-specific
        rentAmount: numeric("rent_amount"),
        rentPeriod: text("rent_period"), // week, month
        rentDisplay: boolean("rent_display").default(true),
        bond: numeric("bond"),
        dateAvailable: timestamp("date_available", { withTimezone: true }),

        // Commercial-specific
        commercialRent: numeric("commercial_rent"),
        commercialRentPsmMin: numeric("commercial_rent_psm_min"),
        commercialRentPsmMax: numeric("commercial_rent_psm_max"),
        outgoings: numeric("outgoings"),
        returnPercent: numeric("return_percent"),
        currentLeaseEnd: timestamp("current_lease_end", { withTimezone: true }),
        tenancy: text("tenancy"),
        propertyExtent: text("property_extent"),
        carSpaces: integer("car_spaces"),
        zone: text("zone"),
        furtherOptions: text("further_options"),

        // Land / Building
        landArea: numeric("land_area"),
        landAreaUnit: text("land_area_unit"),
        buildingArea: numeric("building_area"),
        buildingAreaUnit: text("building_area_unit"),
        frontage: numeric("frontage"),
        energyRating: numeric("energy_rating"),

        // Flags
        underOffer: boolean("under_offer").default(false),
        isNewConstruction: boolean("is_new_construction").default(false),
        isHomeLandPackage: boolean("is_home_land_package").default(false),
        depositTaken: boolean("deposit_taken").default(false),

        // Dates
        yearBuilt: integer("year_built"),
        yearRenovated: integer("year_renovated"),
        auctionDate: timestamp("auction_date", { withTimezone: true }),

        // Sold details
        soldPrice: numeric("sold_price"),
        soldPriceDisplay: text("sold_price_display"),
        soldDate: timestamp("sold_date", { withTimezone: true }),

        // External links
        externalLink: text("external_link"),
        videoLink: text("video_link"),

        // JSONB for flexible structures
        ruralFeatures: jsonb("rural_features"),
        ecoFeatures: jsonb("eco_features"),

        // Metadata
        modTime: timestamp("mod_time", { withTimezone: true }),
        viewCount: integer("view_count").default(0),
        inquiryCount: integer("inquiry_count").default(0),
        searchScore: numeric("search_score").default("0"),
        isPublished: boolean("is_published").default(true),

        // Full-text search vector (populated by trigger)
        searchVector: tsvector("search_vector"),

        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("idx_listings_external").on(table.crmAgentId, table.externalListingId),
        index("idx_listings_property").on(table.propertyId),
        index("idx_listings_status").on(table.status),
        index("idx_listings_property_type").on(table.propertyType),
        index("idx_listings_listing_type").on(table.listingType),
        index("idx_listings_price").on(table.price),
        index("idx_listings_rent").on(table.rentAmount),
    ],
);
