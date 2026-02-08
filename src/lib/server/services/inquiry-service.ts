/**
 * Inquiry service — handles creating, listing, and updating inquiries.
 * Consumers send inquiries on listings (public). Agents view and manage them.
 */

import { and, eq, sql, desc, asc, type SQL } from "drizzle-orm";
import type { Database } from "$db/connection";
import { inquiries } from "$db/schema/consumer";
import { listings } from "$db/schema/listings";
import type { PaginatedResponse, PaginationMeta } from "$types/api";

// ============================================================
// TYPES
// ============================================================

/** Input for creating an inquiry (already validated by Zod) */
export interface CreateInquiryInput {
    listingId: string;
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    message: string;
}

/** Search params for agent inquiry listing */
export interface InquirySearchParams {
    status?: string;
    listingId?: string;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
}

/** Status update input */
export interface UpdateInquiryStatusInput {
    status: "read" | "responded";
}

/** Inquiry summary returned in list responses */
export interface InquirySummary {
    id: string;
    listingId: string;
    senderName: string;
    senderEmail: string;
    senderPhone: string | null;
    message: string;
    status: string;
    createdAt: Date;
    respondedAt: Date | null;
    listing: {
        headline: string | null;
        propertyType: string;
        status: string;
    } | null;
}

/** Inquiry detail returned for single inquiry */
export interface InquiryDetail extends InquirySummary {
    userId: string | null;
}

// ============================================================
// SERVICE FUNCTIONS
// ============================================================

/**
 * Create a new inquiry on a listing.
 * Public — no auth required. If user is logged in, userId is attached.
 */
export async function createInquiry(
    db: Database,
    input: CreateInquiryInput,
    userId?: string | null,
): Promise<{ id: string }> {
    // Verify the listing exists and is currently published
    const listing = await db
        .select({ id: listings.id, status: listings.status, isPublished: listings.isPublished })
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

    if (listing.length === 0) {
        return Promise.reject(new InquiryError("Listing not found", "LISTING_NOT_FOUND", 404));
    }

    const target = listing[0]!;
    if (!target.isPublished || target.status !== "current") {
        return Promise.reject(new InquiryError("Listing is not available for inquiries", "LISTING_UNAVAILABLE", 400));
    }

    const result = await db
        .insert(inquiries)
        .values({
            listingId: input.listingId,
            userId: userId ?? null,
            senderName: input.senderName,
            senderEmail: input.senderEmail,
            senderPhone: input.senderPhone ?? null,
            message: input.message,
            status: "unread",
        })
        .returning({ id: inquiries.id });

    const inserted = result[0]!;

    // Increment inquiry count on the listing (async, non-blocking)
    db.update(listings)
        .set({ inquiryCount: sql`${listings.inquiryCount} + 1` })
        .where(eq(listings.id, input.listingId))
        .then(() => {})
        .catch(() => {});

    return { id: inserted.id };
}

/**
 * Get inquiries for an agent's agency listings.
 * Filters to only show inquiries on listings owned by the agent's agency.
 */
export async function getAgentInquiries(
    db: Database,
    agencyId: string,
    params: InquirySearchParams,
): Promise<PaginatedResponse<InquirySummary>> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    // Build WHERE conditions — only inquiries on this agency's listings
    const conditions: SQL[] = [eq(listings.agencyId, agencyId)];

    if (params.status) {
        conditions.push(eq(inquiries.status, params.status));
    }

    if (params.listingId) {
        conditions.push(eq(inquiries.listingId, params.listingId));
    }

    const whereClause = and(...conditions)!;

    // Count total
    const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(inquiries)
        .innerJoin(listings, eq(inquiries.listingId, listings.id))
        .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    // Determine sort order
    const orderBy = params.order === "asc" ? asc(inquiries.createdAt) : desc(inquiries.createdAt);

    // Fetch inquiries with listing summary
    const rows = await db
        .select({
            id: inquiries.id,
            listingId: inquiries.listingId,
            senderName: inquiries.senderName,
            senderEmail: inquiries.senderEmail,
            senderPhone: inquiries.senderPhone,
            message: inquiries.message,
            status: inquiries.status,
            createdAt: inquiries.createdAt,
            respondedAt: inquiries.respondedAt,
            listingHeadline: listings.headline,
            listingPropertyType: listings.propertyType,
            listingStatus: listings.status,
        })
        .from(inquiries)
        .innerJoin(listings, eq(inquiries.listingId, listings.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

    const data: InquirySummary[] = rows.map((row) => ({
        id: row.id,
        listingId: row.listingId,
        senderName: row.senderName,
        senderEmail: row.senderEmail,
        senderPhone: row.senderPhone,
        message: row.message,
        status: row.status,
        createdAt: row.createdAt,
        respondedAt: row.respondedAt,
        listing: {
            headline: row.listingHeadline,
            propertyType: row.listingPropertyType,
            status: row.listingStatus,
        },
    }));

    const meta: PaginationMeta = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
    };

    return { data, meta };
}

/**
 * Get a single inquiry by ID.
 * Verifies the inquiry belongs to the agent's agency.
 */
export async function getInquiryById(db: Database, inquiryId: string, agencyId: string): Promise<InquiryDetail | null> {
    const rows = await db
        .select({
            id: inquiries.id,
            listingId: inquiries.listingId,
            userId: inquiries.userId,
            senderName: inquiries.senderName,
            senderEmail: inquiries.senderEmail,
            senderPhone: inquiries.senderPhone,
            message: inquiries.message,
            status: inquiries.status,
            createdAt: inquiries.createdAt,
            respondedAt: inquiries.respondedAt,
            listingHeadline: listings.headline,
            listingPropertyType: listings.propertyType,
            listingStatus: listings.status,
        })
        .from(inquiries)
        .innerJoin(listings, eq(inquiries.listingId, listings.id))
        .where(and(eq(inquiries.id, inquiryId), eq(listings.agencyId, agencyId)))
        .limit(1);

    if (rows.length === 0) {
        return null;
    }

    const row = rows[0]!;
    return {
        id: row.id,
        listingId: row.listingId,
        userId: row.userId,
        senderName: row.senderName,
        senderEmail: row.senderEmail,
        senderPhone: row.senderPhone,
        message: row.message,
        status: row.status,
        createdAt: row.createdAt,
        respondedAt: row.respondedAt,
        listing: {
            headline: row.listingHeadline,
            propertyType: row.listingPropertyType,
            status: row.listingStatus,
        },
    };
}

/**
 * Update inquiry status (mark as read or responded).
 * Only allows forward transitions: unread → read → responded.
 * Verifies the inquiry belongs to the agent's agency.
 */
export async function updateInquiryStatus(
    db: Database,
    inquiryId: string,
    agencyId: string,
    input: UpdateInquiryStatusInput,
): Promise<{ id: string; status: string } | null> {
    // Verify ownership and get current status
    const existing = await getInquiryById(db, inquiryId, agencyId);
    if (!existing) {
        return null;
    }

    // Validate status transition
    if (!isValidStatusTransition(existing.status, input.status)) {
        return Promise.reject(
            new InquiryError(
                `Cannot transition from '${existing.status}' to '${input.status}'`,
                "INVALID_STATUS_TRANSITION",
                400,
            ),
        );
    }

    const updateData: Record<string, unknown> = {
        status: input.status,
    };

    if (input.status === "responded") {
        updateData.respondedAt = new Date();
    }

    const result = await db
        .update(inquiries)
        .set(updateData)
        .where(eq(inquiries.id, inquiryId))
        .returning({ id: inquiries.id, status: inquiries.status });

    return result[0] ?? null;
}

// ============================================================
// HELPERS
// ============================================================

/** Valid inquiry status transitions (forward-only) */
const VALID_INQUIRY_TRANSITIONS: Record<string, string[]> = {
    unread: ["read", "responded"],
    read: ["responded"],
    responded: [],
};

/**
 * Check if a status transition is valid.
 */
function isValidStatusTransition(current: string, next: string): boolean {
    const allowed = VALID_INQUIRY_TRANSITIONS[current];
    return allowed ? allowed.includes(next) : false;
}

/**
 * Custom error for inquiry operations.
 * Carries HTTP status and error code for consistent API responses.
 */
export class InquiryError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly httpStatus: number,
    ) {
        super(message);
        this.name = "InquiryError";
    }
}
