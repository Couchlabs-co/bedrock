/**
 * Listing detail tables — features, addresses, images, inspections, and agents.
 * All have a foreign key to the listings table.
 */

import { pgTable, uuid, text, boolean, timestamp, smallint, index, unique } from "drizzle-orm/pg-core";
import { listings } from "./listings";
import { agents } from "./organisations";
import { geographyPoint } from "./custom-types";

/** Listing features — normalised property feature flags */
export const listingFeatures = pgTable("listing_features", {
    listingId: uuid("listing_id")
        .primaryKey()
        .references(() => listings.id, { onDelete: "cascade" }),
    bedrooms: smallint("bedrooms"),
    bathrooms: smallint("bathrooms"),
    ensuites: smallint("ensuites"),
    garages: smallint("garages"),
    carports: smallint("carports"),
    openSpaces: smallint("open_spaces"),
    toilets: smallint("toilets"),
    livingAreas: smallint("living_areas"),
    remoteGarage: boolean("remote_garage"),
    secureParking: boolean("secure_parking"),
    airConditioning: boolean("air_conditioning"),
    alarmSystem: boolean("alarm_system"),
    vacuumSystem: boolean("vacuum_system"),
    intercom: boolean("intercom"),
    poolInground: boolean("pool_inground"),
    poolAbove: boolean("pool_above"),
    spa: boolean("spa"),
    tennisCourt: boolean("tennis_court"),
    balcony: boolean("balcony"),
    deck: boolean("deck"),
    courtyard: boolean("courtyard"),
    outdoorEnt: boolean("outdoor_ent"),
    shed: boolean("shed"),
    fullyFenced: boolean("fully_fenced"),
    openFireplace: boolean("open_fireplace"),
    heatingType: text("heating_type"),
    hotWaterType: text("hot_water_type"),
    insideSpa: boolean("inside_spa"),
    outsideSpa: boolean("outside_spa"),
    broadband: boolean("broadband"),
    builtInRobes: boolean("built_in_robes"),
    dishwasher: boolean("dishwasher"),
    ductedCooling: boolean("ducted_cooling"),
    ductedHeating: boolean("ducted_heating"),
    evapCooling: boolean("evap_cooling"),
    floorboards: boolean("floorboards"),
    gasHeating: boolean("gas_heating"),
    gym: boolean("gym"),
    hydronicHeating: boolean("hydronic_heating"),
    payTv: boolean("pay_tv"),
    reverseCycle: boolean("reverse_cycle"),
    rumpusRoom: boolean("rumpus_room"),
    splitSystemAc: boolean("split_system_ac"),
    splitSystemHeat: boolean("split_system_heat"),
    study: boolean("study"),
    workshop: boolean("workshop"),
    otherFeatures: text("other_features"),
    // Rental allowances
    petFriendly: boolean("pet_friendly"),
    furnished: boolean("furnished"),
    smokersAllowed: boolean("smokers_allowed"),
});

/** Listing addresses — with PostGIS geography for geospatial queries */
export const listingAddresses = pgTable(
    "listing_addresses",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        listingId: uuid("listing_id")
            .notNull()
            .unique()
            .references(() => listings.id, { onDelete: "cascade" }),
        display: boolean("display").default(true),
        siteName: text("site_name"),
        subNumber: text("sub_number"),
        lotNumber: text("lot_number"),
        streetNumber: text("street_number"),
        street: text("street").notNull(),
        suburb: text("suburb").notNull(),
        suburbDisplay: boolean("suburb_display").default(true),
        state: text("state"),
        postcode: text("postcode"),
        region: text("region"),
        country: text("country").default("AUS"),
        municipality: text("municipality"),
        location: geographyPoint("location"),
        formatted: text("formatted"), // computed at application layer
    },
    (table) => [
        index("idx_addresses_suburb").on(table.suburb),
        index("idx_addresses_postcode").on(table.postcode),
        index("idx_addresses_state").on(table.state),
    ],
);

/** Listing images — photos, floorplans, and documents */
export const listingImages = pgTable(
    "listing_images",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        listingId: uuid("listing_id")
            .notNull()
            .references(() => listings.id, { onDelete: "cascade" }),
        type: text("type").notNull(), // photo, floorplan, document
        sortOrder: smallint("sort_order").notNull().default(0),
        originalId: text("original_id"), // REAXML img id (m, a, b, etc.)
        url: text("url").notNull(),
        urlThumb: text("url_thumb"),
        urlMedium: text("url_medium"),
        urlLarge: text("url_large"),
        format: text("format"),
        title: text("title"),
        modTime: timestamp("mod_time", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index("idx_listing_images_listing").on(table.listingId, table.sortOrder)],
);

/** Listing inspections — open inspection times */
export const listingInspections = pgTable("listing_inspections", {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
        .notNull()
        .references(() => listings.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Listing agents — join table for multiple agents per listing */
export const listingAgents = pgTable(
    "listing_agents",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        listingId: uuid("listing_id")
            .notNull()
            .references(() => listings.id, { onDelete: "cascade" }),
        agentId: uuid("agent_id").references(() => agents.id),
        position: smallint("position").notNull().default(1),
        name: text("name").notNull(),
        email: text("email"),
        phoneMobile: text("phone_mobile"),
        phoneOffice: text("phone_office"),
        agentIdCode: text("agent_id_code"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [unique("uq_listing_agents_position").on(table.listingId, table.position)],
);
