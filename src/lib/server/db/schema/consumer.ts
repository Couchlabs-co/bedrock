/**
 * Consumer feature tables — favourites, saved searches, inquiries, notifications.
 */

import { pgTable, uuid, text, boolean, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { listings } from "./listings";

/** Favourites — users can save listings */
export const favourites = pgTable(
    "favourites",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        listingId: uuid("listing_id")
            .notNull()
            .references(() => listings.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        unique("uq_favourites_user_listing").on(table.userId, table.listingId),
        index("idx_favourites_user").on(table.userId),
    ],
);

/** Saved searches — stored filter sets with notification preferences */
export const savedSearches = pgTable("saved_searches", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name"),
    filters: jsonb("filters").notNull(),
    notifyEmail: boolean("notify_email").default(true),
    notifyPush: boolean("notify_push").default(false),
    lastMatchedAt: timestamp("last_matched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Inquiries — messages from consumers to agents about listings */
export const inquiries = pgTable(
    "inquiries",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        listingId: uuid("listing_id")
            .notNull()
            .references(() => listings.id, { onDelete: "cascade" }),
        userId: uuid("user_id").references(() => users.id),
        senderName: text("sender_name").notNull(),
        senderEmail: text("sender_email").notNull(),
        senderPhone: text("sender_phone"),
        message: text("message").notNull(),
        status: text("status").notNull().default("unread"), // unread, read, responded
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        respondedAt: timestamp("responded_at", { withTimezone: true }),
    },
    (table) => [index("idx_inquiries_listing").on(table.listingId)],
);

/** Notifications — in-app and email alerts for users */
export const notifications = pgTable(
    "notifications",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").notNull(), // new_match, price_change, inquiry_received
        title: text("title").notNull(),
        body: text("body"),
        link: text("link"),
        isRead: boolean("is_read").default(false),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index("idx_notifications_user").on(table.userId, table.isRead)],
);
