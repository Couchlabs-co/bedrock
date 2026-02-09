/**
 * Properties and addresses tables.
 * Property represents the physical real estate asset.
 * Address is a standalone entity reusable across properties and listings.
 */

import { pgTable, uuid, text, numeric, smallint, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";

/** Addresses — standalone canonical address entity */
export const addresses = pgTable(
    "addresses",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        unitNumber: text("unit_number"),
        lotNumber: text("lot_number"),
        streetNumber: text("street_number"),
        street: text("street").notNull(),
        suburb: text("suburb").notNull(),
        city: text("city"),
        state: text("state"),
        postcode: text("postcode"),
        country: text("country").notNull().default("AUS"),
        region: text("region"),
        municipality: text("municipality"),
        longitude: numeric("longitude"),
        latitude: numeric("latitude"),
        formatted: text("formatted"),
        normalisedKey: text("normalised_key").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        unique("uq_addresses_normalised").on(table.normalisedKey),
        index("idx_addresses_suburb").on(table.suburb),
        index("idx_addresses_postcode").on(table.postcode),
        index("idx_addresses_state").on(table.state),
        index("idx_addresses_city").on(table.city),
    ],
);

/** Properties — physical real estate assets with canonical attributes */
export const properties = pgTable(
    "properties",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        addressId: uuid("address_id")
            .notNull()
            .unique()
            .references(() => addresses.id, { onDelete: "restrict" }),
        titleRef: text("title_ref"),
        propertyType: text("property_type"),
        category: text("category"),
        bedrooms: smallint("bedrooms"),
        bathrooms: smallint("bathrooms"),
        ensuites: smallint("ensuites"),
        garages: smallint("garages"),
        carports: smallint("carports"),
        openSpaces: smallint("open_spaces"),
        toilets: smallint("toilets"),
        livingAreas: smallint("living_areas"),
        landArea: numeric("land_area"),
        landAreaUnit: text("land_area_unit"),
        buildingArea: numeric("building_area"),
        buildingAreaUnit: text("building_area_unit"),
        yearBuilt: smallint("year_built"),
        yearRenovated: smallint("year_renovated"),
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
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index("idx_properties_address").on(table.addressId)],
);
