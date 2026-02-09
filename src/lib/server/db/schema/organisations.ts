/**
 * Organisational hierarchy tables.
 * Organisation → Agency → Agent
 */

import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

/** Organisations — top-level entity that owns agencies */
export const organisations = pgTable("organisations", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Agencies — real estate offices, belong to an organisation */
export const agencies = pgTable("agencies", {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id").references(() => organisations.id),
    agentIdCode: text("agent_id_code").notNull().unique(), // maps to REAXML <agentID>
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    logoUrl: text("logo_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Agents — individual real estate agents, belong to an agency */
export const agents = pgTable("agents", {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id")
        .notNull()
        .references(() => agencies.id),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id),
    name: text("name").notNull(),
    email: text("email"),
    phoneMobile: text("phone_mobile"),
    phoneOffice: text("phone_office"),
    photoUrl: text("photo_url"),
    bio: text("bio"),
    twitterUrl: text("twitter_url"),
    facebookUrl: text("facebook_url"),
    linkedinUrl: text("linkedin_url"),
    uniqueAgentId: text("unique_agent_id"), // maps to REAXML <uniqueListingAgentID>
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
