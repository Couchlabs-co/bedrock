import { describe, it, expect } from "vitest";
import { formatPrice, formatRent, formatArea } from "$lib/utils/format";

describe("formatPrice", () =>
{
    it("should format a whole number price", () =>
    {
        expect(formatPrice(500000)).toBe("$500,000");
    });

    it("should format a million-dollar price", () =>
    {
        expect(formatPrice(1250000)).toBe("$1,250,000");
    });

    it("should return 'Price on request' for null", () =>
    {
        expect(formatPrice(null)).toBe("Price on request");
    });

    it("should return 'Price on request' for undefined", () =>
    {
        expect(formatPrice(undefined)).toBe("Price on request");
    });

    it("should format zero", () =>
    {
        expect(formatPrice(0)).toBe("$0");
    });
});

describe("formatRent", () =>
{
    it("should format weekly rent", () =>
    {
        expect(formatRent(550, "week")).toBe("$550 /wk");
    });

    it("should format monthly rent", () =>
    {
        expect(formatRent(2200, "month")).toBe("$2,200 /mo");
    });

    it("should return 'Contact agent' for null amount", () =>
    {
        expect(formatRent(null, "week")).toBe("Contact agent");
    });

    it("should default to weekly if period is unknown", () =>
    {
        expect(formatRent(350, "weekly")).toBe("$350 /wk");
    });
});

describe("formatArea", () =>
{
    it("should format square meters", () =>
    {
        expect(formatArea(450, "squareMeter")).toBe("450 m²");
    });

    it("should format acres", () =>
    {
        expect(formatArea(50, "acre")).toBe("50 acres");
    });

    it("should format hectares", () =>
    {
        expect(formatArea(10, "hectare")).toBe("10 ha");
    });

    it("should return empty string for null", () =>
    {
        expect(formatArea(null, "squareMeter")).toBe("");
    });
});
