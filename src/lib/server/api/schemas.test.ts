/**
 * Tests for API query parameter schemas.
 */

import { describe, it, expect } from "vitest";
import {
    listingSearchSchema,
    nearbySearchSchema,
    suburbSearchSchema,
    uuidParamSchema,
    searchParamsToObject,
} from "./schemas";

describe("searchParamsToObject", () => {
    it("converts URLSearchParams to plain object", () => {
        const params = new URLSearchParams("suburb=RICHMOND&state=vic&page=2");
        const obj = searchParamsToObject(params);
        expect(obj).toEqual({ suburb: "RICHMOND", state: "vic", page: "2" });
    });

    it("skips empty values", () => {
        const params = new URLSearchParams("suburb=&state=vic&q=");
        const obj = searchParamsToObject(params);
        expect(obj).toEqual({ state: "vic" });
    });

    it("returns empty object for empty params", () => {
        const params = new URLSearchParams("");
        const obj = searchParamsToObject(params);
        expect(obj).toEqual({});
    });
});

describe("listingSearchSchema", () => {
    it("parses valid search params", () => {
        const result = listingSearchSchema.safeParse({
            suburb: "RICHMOND",
            state: "vic",
            propertyType: "house",
            listingType: "sale",
            priceMin: "300000",
            priceMax: "600000",
            bedsMin: "3",
            page: "2",
            limit: "10",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.suburb).toBe("RICHMOND");
            expect(result.data.priceMin).toBe(300000);
            expect(result.data.priceMax).toBe(600000);
            expect(result.data.bedsMin).toBe(3);
            expect(result.data.page).toBe(2);
            expect(result.data.limit).toBe(10);
        }
    });

    it("applies default page and limit", () => {
        const result = listingSearchSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.page).toBe(1);
            expect(result.data.limit).toBe(20);
        }
    });

    it("rejects invalid property type", () => {
        const result = listingSearchSchema.safeParse({ propertyType: "mansion" });
        expect(result.success).toBe(false);
    });

    it("rejects invalid listing type", () => {
        const result = listingSearchSchema.safeParse({ listingType: "free" });
        expect(result.success).toBe(false);
    });

    it("rejects negative price", () => {
        const result = listingSearchSchema.safeParse({ priceMin: "-100" });
        expect(result.success).toBe(false);
    });

    it("rejects limit above 100", () => {
        const result = listingSearchSchema.safeParse({ limit: "200" });
        expect(result.success).toBe(false);
    });

    it("rejects invalid sort field", () => {
        const result = listingSearchSchema.safeParse({ sort: "random" });
        expect(result.success).toBe(false);
    });

    it("accepts valid sort and order", () => {
        const result = listingSearchSchema.safeParse({ sort: "price", order: "asc" });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.sort).toBe("price");
            expect(result.data.order).toBe("asc");
        }
    });

    it("allows all params to be optional", () => {
        const result = listingSearchSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.q).toBeUndefined();
            expect(result.data.suburb).toBeUndefined();
            expect(result.data.propertyType).toBeUndefined();
        }
    });

    it("coerces string numbers to numbers", () => {
        const result = listingSearchSchema.safeParse({
            priceMin: "100000",
            bedsMin: "2",
            bathsMin: "1",
            carsMin: "1",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.priceMin).toBe(100000);
            expect(result.data.bedsMin).toBe(2);
            expect(result.data.bathsMin).toBe(1);
            expect(result.data.carsMin).toBe(1);
        }
    });

    it("truncates long q param", () => {
        const longQ = "a".repeat(201);
        const result = listingSearchSchema.safeParse({ q: longQ });
        expect(result.success).toBe(false);
    });
});

describe("nearbySearchSchema", () => {
    it("parses valid nearby params", () => {
        const result = nearbySearchSchema.safeParse({
            lat: "-37.8136",
            lng: "144.9631",
            radiusKm: "10",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.lat).toBeCloseTo(-37.8136);
            expect(result.data.lng).toBeCloseTo(144.9631);
            expect(result.data.radiusKm).toBe(10);
        }
    });

    it("requires lat and lng", () => {
        expect(nearbySearchSchema.safeParse({}).success).toBe(false);
        expect(nearbySearchSchema.safeParse({ lat: "-37" }).success).toBe(false);
        expect(nearbySearchSchema.safeParse({ lng: "144" }).success).toBe(false);
    });

    it("rejects lat outside -90..90", () => {
        expect(nearbySearchSchema.safeParse({ lat: "91", lng: "0" }).success).toBe(false);
        expect(nearbySearchSchema.safeParse({ lat: "-91", lng: "0" }).success).toBe(false);
    });

    it("rejects lng outside -180..180", () => {
        expect(nearbySearchSchema.safeParse({ lat: "0", lng: "181" }).success).toBe(false);
    });

    it("rejects radius above 50km", () => {
        const result = nearbySearchSchema.safeParse({ lat: "0", lng: "0", radiusKm: "60" });
        expect(result.success).toBe(false);
    });

    it("defaults radiusKm to 5", () => {
        const result = nearbySearchSchema.safeParse({ lat: "0", lng: "0" });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.radiusKm).toBe(5);
        }
    });

    it("applies default page and limit", () => {
        const result = nearbySearchSchema.safeParse({ lat: "0", lng: "0" });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.page).toBe(1);
            expect(result.data.limit).toBe(20);
        }
    });
});

describe("suburbSearchSchema", () => {
    it("parses valid suburb query", () => {
        const result = suburbSearchSchema.safeParse({ q: "rich", limit: "5" });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.q).toBe("rich");
            expect(result.data.limit).toBe(5);
        }
    });

    it("requires minimum 2 characters for q", () => {
        expect(suburbSearchSchema.safeParse({ q: "r" }).success).toBe(false);
    });

    it("requires q parameter", () => {
        expect(suburbSearchSchema.safeParse({}).success).toBe(false);
    });

    it("defaults limit to 10", () => {
        const result = suburbSearchSchema.safeParse({ q: "ri" });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.limit).toBe(10);
        }
    });

    it("rejects limit above 50", () => {
        expect(suburbSearchSchema.safeParse({ q: "rich", limit: "51" }).success).toBe(false);
    });
});

describe("uuidParamSchema", () => {
    it("accepts valid UUID", () => {
        const result = uuidParamSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
        expect(result.success).toBe(true);
    });

    it("rejects invalid UUID", () => {
        expect(uuidParamSchema.safeParse("not-a-uuid").success).toBe(false);
        expect(uuidParamSchema.safeParse("12345").success).toBe(false);
        expect(uuidParamSchema.safeParse("").success).toBe(false);
    });
});
