/**
 * Tests for Phase 2B — Agent listing API schemas, guards, and service types.
 */

import { describe, it, expect } from "vitest";
import {
    createListingSchema,
    statusChangeSchema,
    agentListingSearchSchema,
    addressInputSchema,
    featuresInputSchema,
    imageInputSchema,
    inspectionInputSchema,
    agentInputSchema,
} from "./schemas";
import { requireAuth, requireRole, requireAgent, requireAdmin } from "./guards";
import type { RequestEvent } from "@sveltejs/kit";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function mockEvent(user: App.Locals["user"] = null): RequestEvent {
    return {
        locals: { user },
    } as unknown as RequestEvent;
}

// ---------------------------------------------------------------------------
// guards
// ---------------------------------------------------------------------------

describe("requireAuth", () => {
    it("returns user when authenticated", () => {
        const user = { id: "u1", email: "a@b.com", role: "agent" as const, firstName: "A", lastName: "B" };
        const result = requireAuth(mockEvent(user));
        expect(result).toEqual(user);
    });

    it("throws 401 when no user", () => {
        expect(() => requireAuth(mockEvent(null))).toThrow();
    });
});

describe("requireRole", () => {
    it("returns user when role matches", () => {
        const user = { id: "u1", email: "a@b.com", role: "admin" as const, firstName: null, lastName: null };
        const result = requireRole(mockEvent(user), "admin");
        expect(result).toEqual(user);
    });

    it("accepts multiple roles", () => {
        const user = { id: "u1", email: "a@b.com", role: "agent" as const, firstName: null, lastName: null };
        const result = requireRole(mockEvent(user), "agent", "admin");
        expect(result).toEqual(user);
    });

    it("throws 403 when role does not match", () => {
        const user = { id: "u1", email: "a@b.com", role: "consumer" as const, firstName: null, lastName: null };
        expect(() => requireRole(mockEvent(user), "agent")).toThrow();
    });

    it("throws 401 when not authenticated", () => {
        expect(() => requireRole(mockEvent(null), "agent")).toThrow();
    });
});

describe("requireAgent", () => {
    it("allows agent role", () => {
        const user = { id: "u1", email: "a@b.com", role: "agent" as const, firstName: null, lastName: null };
        expect(requireAgent(mockEvent(user))).toEqual(user);
    });

    it("allows admin role", () => {
        const user = { id: "u1", email: "a@b.com", role: "admin" as const, firstName: null, lastName: null };
        expect(requireAdmin(mockEvent(user))).toEqual(user);
    });

    it("rejects consumer role", () => {
        const user = { id: "u1", email: "a@b.com", role: "consumer" as const, firstName: null, lastName: null };
        expect(() => requireAgent(mockEvent(user))).toThrow();
    });
});

describe("requireAdmin", () => {
    it("rejects agent role", () => {
        const user = { id: "u1", email: "a@b.com", role: "agent" as const, firstName: null, lastName: null };
        expect(() => requireAdmin(mockEvent(user))).toThrow();
    });
});

// ---------------------------------------------------------------------------
// addressInputSchema
// ---------------------------------------------------------------------------

describe("addressInputSchema", () => {
    it("accepts valid address", () => {
        const result = addressInputSchema.safeParse({
            street: "123 Main St",
            suburb: "RICHMOND",
            state: "VIC",
            postcode: "3121",
        });
        expect(result.success).toBe(true);
    });

    it("requires street", () => {
        const result = addressInputSchema.safeParse({ suburb: "RICHMOND" });
        expect(result.success).toBe(false);
    });

    it("requires suburb", () => {
        const result = addressInputSchema.safeParse({ street: "123 Main St" });
        expect(result.success).toBe(false);
    });

    it("trims optional fields", () => {
        const result = addressInputSchema.safeParse({
            street: "1 Smith Rd",
            suburb: "A",
        });
        expect(result.success).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// featuresInputSchema
// ---------------------------------------------------------------------------

describe("featuresInputSchema", () => {
    it("accepts all fields", () => {
        const result = featuresInputSchema.safeParse({
            bedrooms: 3,
            bathrooms: 2,
            garages: 1,
            airConditioning: true,
            poolInground: false,
        });
        expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
        const result = featuresInputSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it("rejects negative bedrooms", () => {
        const result = featuresInputSchema.safeParse({ bedrooms: -1 });
        expect(result.success).toBe(false);
    });

    it("rejects bedrooms > 99", () => {
        const result = featuresInputSchema.safeParse({ bedrooms: 100 });
        expect(result.success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// imageInputSchema
// ---------------------------------------------------------------------------

describe("imageInputSchema", () => {
    it("accepts valid image", () => {
        const result = imageInputSchema.safeParse({
            type: "photo",
            url: "https://example.com/photo.jpg",
            sortOrder: 0,
        });
        expect(result.success).toBe(true);
    });

    it("rejects missing url", () => {
        const result = imageInputSchema.safeParse({ type: "photo" });
        expect(result.success).toBe(false);
    });

    it("rejects invalid type", () => {
        const result = imageInputSchema.safeParse({
            type: "video",
            url: "https://example.com/photo.jpg",
        });
        expect(result.success).toBe(false);
    });

    it("accepts floorplan type", () => {
        const result = imageInputSchema.safeParse({
            type: "floorplan",
            url: "https://example.com/fp.pdf",
        });
        expect(result.success).toBe(true);
    });

    it("rejects invalid url format", () => {
        const result = imageInputSchema.safeParse({
            type: "photo",
            url: "not-a-url",
        });
        expect(result.success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// inspectionInputSchema
// ---------------------------------------------------------------------------

describe("inspectionInputSchema", () => {
    it("accepts valid inspection", () => {
        const result = inspectionInputSchema.safeParse({
            description: "Open house",
            startsAt: "2025-03-01T10:00:00Z",
            endsAt: "2025-03-01T11:00:00Z",
        });
        expect(result.success).toBe(true);
    });

    it("requires description", () => {
        const result = inspectionInputSchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it("accepts description-only", () => {
        const result = inspectionInputSchema.safeParse({ description: "By appointment" });
        expect(result.success).toBe(true);
    });

    it("rejects invalid datetime", () => {
        const result = inspectionInputSchema.safeParse({
            description: "Open",
            startsAt: "not-a-date",
        });
        expect(result.success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// agentInputSchema
// ---------------------------------------------------------------------------

describe("agentInputSchema", () => {
    it("accepts valid agent", () => {
        const result = agentInputSchema.safeParse({
            name: "Jane Doe",
            email: "jane@example.com",
            phoneMobile: "0400 111 222",
            position: 1,
        });
        expect(result.success).toBe(true);
    });

    it("requires name", () => {
        const result = agentInputSchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
        const result = agentInputSchema.safeParse({ name: "A", email: "bad" });
        expect(result.success).toBe(false);
    });

    it("rejects position out of range", () => {
        expect(agentInputSchema.safeParse({ name: "A", position: 0 }).success).toBe(false);
        expect(agentInputSchema.safeParse({ name: "A", position: 11 }).success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// createListingSchema
// ---------------------------------------------------------------------------

describe("createListingSchema", () => {
    const validListing = {
        propertyType: "residential",
        listingType: "sale",
        headline: "Beautiful 3BR home",
        price: 650000,
        address: { street: "123 Main St", suburb: "RICHMOND" },
        features: { bedrooms: 3, bathrooms: 2, garages: 1 },
    };

    it("accepts valid listing", () => {
        const result = createListingSchema.safeParse(validListing);
        expect(result.success).toBe(true);
    });

    it("requires propertyType", () => {
        const { propertyType: _pt, ...rest } = validListing;
        expect(createListingSchema.safeParse(rest).success).toBe(false);
    });

    it("requires listingType", () => {
        const { listingType: _lt, ...rest } = validListing;
        expect(createListingSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects invalid propertyType", () => {
        expect(createListingSchema.safeParse({ ...validListing, propertyType: "mansion" }).success).toBe(false);
    });

    it("rejects invalid listingType", () => {
        expect(createListingSchema.safeParse({ ...validListing, listingType: "free" }).success).toBe(false);
    });

    it("accepts rental fields", () => {
        const result = createListingSchema.safeParse({
            propertyType: "rental",
            listingType: "rent",
            rentAmount: 550,
            rentPeriod: "week",
            bond: 2200,
            dateAvailable: "2025-04-01T00:00:00Z",
        });
        expect(result.success).toBe(true);
    });

    it("accepts commercial fields", () => {
        const result = createListingSchema.safeParse({
            propertyType: "commercial",
            listingType: "lease",
            commercialRent: 45000,
            outgoings: 5000,
            returnPercent: 6.5,
        });
        expect(result.success).toBe(true);
    });

    it("allows images array", () => {
        const result = createListingSchema.safeParse({
            ...validListing,
            images: [
                { type: "photo", url: "https://example.com/1.jpg", sortOrder: 0 },
                { type: "photo", url: "https://example.com/2.jpg", sortOrder: 1 },
            ],
        });
        expect(result.success).toBe(true);
    });

    it("rejects more than 50 images", () => {
        const images = Array.from({ length: 51 }, (_, i) => ({
            type: "photo" as const,
            url: `https://example.com/${i}.jpg`,
        }));
        expect(createListingSchema.safeParse({ ...validListing, images }).success).toBe(false);
    });

    it("rejects more than 20 inspections", () => {
        const inspections = Array.from({ length: 21 }, () => ({
            description: "Open house",
        }));
        expect(createListingSchema.safeParse({ ...validListing, inspections }).success).toBe(false);
    });

    it("rejects more than 10 agents", () => {
        const agents = Array.from({ length: 11 }, () => ({ name: "Agent" }));
        expect(createListingSchema.safeParse({ ...validListing, agents }).success).toBe(false);
    });

    it("accepts land listing", () => {
        const result = createListingSchema.safeParse({
            propertyType: "land",
            listingType: "sale",
            price: 350000,
            landArea: 800,
            landAreaUnit: "sqm",
            frontage: 20,
        });
        expect(result.success).toBe(true);
    });

    it("rejects negative price", () => {
        expect(createListingSchema.safeParse({ ...validListing, price: -1 }).success).toBe(false);
    });

    it("rejects yearBuilt out of range", () => {
        expect(createListingSchema.safeParse({ ...validListing, yearBuilt: 1700 }).success).toBe(false);
        expect(createListingSchema.safeParse({ ...validListing, yearBuilt: 2200 }).success).toBe(false);
    });

    it("rejects energyRating out of range", () => {
        expect(createListingSchema.safeParse({ ...validListing, energyRating: 11 }).success).toBe(false);
        expect(createListingSchema.safeParse({ ...validListing, energyRating: -1 }).success).toBe(false);
    });

    it("accepts all optional boolean flags", () => {
        const result = createListingSchema.safeParse({
            ...validListing,
            underOffer: true,
            isNewConstruction: false,
            depositTaken: true,
            priceDisplay: false,
        });
        expect(result.success).toBe(true);
    });

    it("accepts minimal listing (just type fields)", () => {
        const result = createListingSchema.safeParse({
            propertyType: "residential",
            listingType: "sale",
        });
        expect(result.success).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// statusChangeSchema
// ---------------------------------------------------------------------------

describe("statusChangeSchema", () => {
    it("accepts valid status change", () => {
        const result = statusChangeSchema.safeParse({ status: "withdrawn" });
        expect(result.success).toBe(true);
    });

    it("accepts sold status with details", () => {
        const result = statusChangeSchema.safeParse({
            status: "sold",
            soldPrice: 750000,
            soldDate: "2025-03-15T00:00:00Z",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.soldPrice).toBe(750000);
        }
    });

    it("requires status", () => {
        expect(statusChangeSchema.safeParse({}).success).toBe(false);
    });

    it("rejects invalid status", () => {
        expect(statusChangeSchema.safeParse({ status: "pending" }).success).toBe(false);
    });

    it("rejects negative soldPrice", () => {
        expect(statusChangeSchema.safeParse({ status: "sold", soldPrice: -1 }).success).toBe(false);
    });

    it("accepts all valid statuses", () => {
        const statuses = ["current", "withdrawn", "offmarket", "sold", "leased", "deleted"];
        for (const status of statuses) {
            expect(statusChangeSchema.safeParse({ status }).success).toBe(true);
        }
    });
});

// ---------------------------------------------------------------------------
// agentListingSearchSchema
// ---------------------------------------------------------------------------

describe("agentListingSearchSchema", () => {
    it("parses valid search params", () => {
        const result = agentListingSearchSchema.safeParse({
            status: "current",
            sort: "price",
            order: "asc",
            page: "1",
            limit: "20",
        });
        expect(result.success).toBe(true);
    });

    it("applies default page and limit", () => {
        const result = agentListingSearchSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.page).toBe(1);
            expect(result.data.limit).toBe(20);
        }
    });

    it("allows all params optional", () => {
        const result = agentListingSearchSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
        expect(agentListingSearchSchema.safeParse({ status: "pending" }).success).toBe(false);
    });

    it("accepts status sort field", () => {
        const result = agentListingSearchSchema.safeParse({ sort: "status" });
        expect(result.success).toBe(true);
    });

    it("rejects invalid sort field", () => {
        expect(agentListingSearchSchema.safeParse({ sort: "random" }).success).toBe(false);
    });

    it("rejects limit above 100", () => {
        expect(agentListingSearchSchema.safeParse({ limit: "200" }).success).toBe(false);
    });
});
