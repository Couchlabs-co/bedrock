/**
 * Tests for Phase 2C — Inquiry API schemas and service types.
 */

import { describe, it, expect } from "vitest";
import { createInquirySchema, updateInquiryStatusSchema, inquirySearchSchema } from "./schemas";

// ---------------------------------------------------------------------------
// createInquirySchema
// ---------------------------------------------------------------------------

describe("createInquirySchema", () => {
    const validInquiry = {
        listingId: "550e8400-e29b-41d4-a716-446655440000",
        senderName: "John Smith",
        senderEmail: "john@example.com",
        senderPhone: "0412 345 678",
        message: "I am interested in this property. When can I inspect it?",
    };

    it("accepts valid inquiry", () => {
        const result = createInquirySchema.safeParse(validInquiry);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.senderName).toBe("John Smith");
            expect(result.data.senderEmail).toBe("john@example.com");
            expect(result.data.senderPhone).toBe("0412 345 678");
        }
    });

    it("accepts inquiry without phone", () => {
        const { senderPhone: _sp, ...rest } = validInquiry;
        const result = createInquirySchema.safeParse(rest);
        expect(result.success).toBe(true);
    });

    it("requires listingId", () => {
        const { listingId: _lid, ...rest } = validInquiry;
        expect(createInquirySchema.safeParse(rest).success).toBe(false);
    });

    it("requires valid UUID for listingId", () => {
        expect(createInquirySchema.safeParse({ ...validInquiry, listingId: "not-a-uuid" }).success).toBe(false);
    });

    it("requires senderName", () => {
        const { senderName: _sn, ...rest } = validInquiry;
        expect(createInquirySchema.safeParse(rest).success).toBe(false);
    });

    it("rejects empty senderName", () => {
        expect(createInquirySchema.safeParse({ ...validInquiry, senderName: "" }).success).toBe(false);
    });

    it("requires senderEmail", () => {
        const { senderEmail: _se, ...rest } = validInquiry;
        expect(createInquirySchema.safeParse(rest).success).toBe(false);
    });

    it("rejects invalid email", () => {
        expect(createInquirySchema.safeParse({ ...validInquiry, senderEmail: "not-email" }).success).toBe(false);
    });

    it("requires message", () => {
        const { message: _m, ...rest } = validInquiry;
        expect(createInquirySchema.safeParse(rest).success).toBe(false);
    });

    it("rejects empty message", () => {
        expect(createInquirySchema.safeParse({ ...validInquiry, message: "" }).success).toBe(false);
    });

    it("rejects message over 5000 chars", () => {
        const longMessage = "a".repeat(5001);
        expect(createInquirySchema.safeParse({ ...validInquiry, message: longMessage }).success).toBe(false);
    });

    it("accepts message at 5000 chars", () => {
        const maxMessage = "a".repeat(5000);
        expect(createInquirySchema.safeParse({ ...validInquiry, message: maxMessage }).success).toBe(true);
    });

    it("rejects senderName over 200 chars", () => {
        const longName = "a".repeat(201);
        expect(createInquirySchema.safeParse({ ...validInquiry, senderName: longName }).success).toBe(false);
    });

    it("rejects senderEmail over 200 chars", () => {
        const longEmail = "a".repeat(190) + "@example.com";
        expect(createInquirySchema.safeParse({ ...validInquiry, senderEmail: longEmail }).success).toBe(false);
    });

    it("rejects senderPhone over 30 chars", () => {
        const longPhone = "1".repeat(31);
        expect(createInquirySchema.safeParse({ ...validInquiry, senderPhone: longPhone }).success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// updateInquiryStatusSchema
// ---------------------------------------------------------------------------

describe("updateInquiryStatusSchema", () => {
    it("accepts 'read' status", () => {
        const result = updateInquiryStatusSchema.safeParse({ status: "read" });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.status).toBe("read");
        }
    });

    it("accepts 'responded' status", () => {
        const result = updateInquiryStatusSchema.safeParse({ status: "responded" });
        expect(result.success).toBe(true);
    });

    it("rejects 'unread' status (cannot go back)", () => {
        expect(updateInquiryStatusSchema.safeParse({ status: "unread" }).success).toBe(false);
    });

    it("rejects invalid status", () => {
        expect(updateInquiryStatusSchema.safeParse({ status: "pending" }).success).toBe(false);
    });

    it("requires status", () => {
        expect(updateInquiryStatusSchema.safeParse({}).success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// inquirySearchSchema
// ---------------------------------------------------------------------------

describe("inquirySearchSchema", () => {
    it("parses valid search params", () => {
        const result = inquirySearchSchema.safeParse({
            status: "unread",
            sort: "date",
            order: "desc",
            page: "1",
            limit: "20",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.status).toBe("unread");
            expect(result.data.page).toBe(1);
        }
    });

    it("applies default page and limit", () => {
        const result = inquirySearchSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.page).toBe(1);
            expect(result.data.limit).toBe(20);
        }
    });

    it("allows all params optional", () => {
        const result = inquirySearchSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
        expect(inquirySearchSchema.safeParse({ status: "pending" }).success).toBe(false);
    });

    it("accepts all valid statuses", () => {
        for (const status of ["unread", "read", "responded"]) {
            expect(inquirySearchSchema.safeParse({ status }).success).toBe(true);
        }
    });

    it("accepts listingId filter", () => {
        const result = inquirySearchSchema.safeParse({
            listingId: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.success).toBe(true);
    });

    it("rejects invalid listingId", () => {
        expect(inquirySearchSchema.safeParse({ listingId: "not-a-uuid" }).success).toBe(false);
    });

    it("rejects invalid sort field", () => {
        expect(inquirySearchSchema.safeParse({ sort: "name" }).success).toBe(false);
    });

    it("rejects limit above 100", () => {
        expect(inquirySearchSchema.safeParse({ limit: "200" }).success).toBe(false);
    });
});
