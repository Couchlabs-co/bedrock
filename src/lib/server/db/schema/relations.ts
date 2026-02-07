/**
 * Drizzle ORM relations — defines how tables relate for the relational query API.
 * These are separate from foreign keys (which enforce integrity at DB level).
 */

import { relations } from "drizzle-orm";
import { organisations, agencies, agents } from "./organisations";
import { users, sessions } from "./users";
import { listings } from "./listings";
import { listingFeatures, listingAddresses, listingImages, listingInspections, listingAgents } from "./listing-details";
import { favourites, savedSearches, inquiries, notifications } from "./consumer";

// ============================================================
// ORGANISATION HIERARCHY
// ============================================================

export const organisationsRelations = relations(organisations, ({ many }) => ({
    agencies: many(agencies),
}));

export const agenciesRelations = relations(agencies, ({ one, many }) => ({
    organisation: one(organisations, {
        fields: [agencies.organisationId],
        references: [organisations.id],
    }),
    agents: many(agents),
    listings: many(listings),
}));

export const agentsRelations = relations(agents, ({ one }) => ({
    agency: one(agencies, {
        fields: [agents.agencyId],
        references: [agencies.id],
    }),
    user: one(users, {
        fields: [agents.userId],
        references: [users.id],
    }),
}));

// ============================================================
// USERS & AUTH
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    favourites: many(favourites),
    savedSearches: many(savedSearches),
    inquiries: many(inquiries),
    notifications: many(notifications),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

// ============================================================
// LISTINGS
// ============================================================

export const listingsRelations = relations(listings, ({ one, many }) => ({
    agency: one(agencies, {
        fields: [listings.agencyId],
        references: [agencies.id],
    }),
    features: one(listingFeatures),
    address: one(listingAddresses),
    images: many(listingImages),
    inspections: many(listingInspections),
    listingAgents: many(listingAgents),
    favourites: many(favourites),
    inquiries: many(inquiries),
}));

export const listingFeaturesRelations = relations(listingFeatures, ({ one }) => ({
    listing: one(listings, {
        fields: [listingFeatures.listingId],
        references: [listings.id],
    }),
}));

export const listingAddressesRelations = relations(listingAddresses, ({ one }) => ({
    listing: one(listings, {
        fields: [listingAddresses.listingId],
        references: [listings.id],
    }),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
    listing: one(listings, {
        fields: [listingImages.listingId],
        references: [listings.id],
    }),
}));

export const listingInspectionsRelations = relations(listingInspections, ({ one }) => ({
    listing: one(listings, {
        fields: [listingInspections.listingId],
        references: [listings.id],
    }),
}));

export const listingAgentsRelations = relations(listingAgents, ({ one }) => ({
    listing: one(listings, {
        fields: [listingAgents.listingId],
        references: [listings.id],
    }),
    agent: one(agents, {
        fields: [listingAgents.agentId],
        references: [agents.id],
    }),
}));

// ============================================================
// CONSUMER FEATURES
// ============================================================

export const favouritesRelations = relations(favourites, ({ one }) => ({
    user: one(users, {
        fields: [favourites.userId],
        references: [users.id],
    }),
    listing: one(listings, {
        fields: [favourites.listingId],
        references: [listings.id],
    }),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
    user: one(users, {
        fields: [savedSearches.userId],
        references: [users.id],
    }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
    listing: one(listings, {
        fields: [inquiries.listingId],
        references: [listings.id],
    }),
    user: one(users, {
        fields: [inquiries.userId],
        references: [users.id],
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));
