/**
 * Tests for REAXML value coercion utilities.
 */

import { describe, it, expect } from "vitest";
import {
    coerceBoolean,
    coerceInt,
    coerceFloat,
    coerceString,
    normaliseAreaUnit,
    squaresToSqm,
    parseReaDate,
    extractText,
    SQUARE_TO_SQM,
} from "./coerce";

describe("coerceBoolean", () => {
    it("returns true for truthy REAXML values", () => {
        expect(coerceBoolean("yes")).toBe(true);
        expect(coerceBoolean("Yes")).toBe(true);
        expect(coerceBoolean("YES")).toBe(true);
        expect(coerceBoolean("1")).toBe(true);
        expect(coerceBoolean("true")).toBe(true);
        expect(coerceBoolean("True")).toBe(true);
        expect(coerceBoolean(1)).toBe(true);
        expect(coerceBoolean(true)).toBe(true);
    });

    it("returns false for falsy REAXML values", () => {
        expect(coerceBoolean("no")).toBe(false);
        expect(coerceBoolean("No")).toBe(false);
        expect(coerceBoolean("0")).toBe(false);
        expect(coerceBoolean("false")).toBe(false);
        expect(coerceBoolean(0)).toBe(false);
        expect(coerceBoolean(false)).toBe(false);
    });

    it("returns false for empty/null/undefined", () => {
        expect(coerceBoolean(undefined)).toBe(false);
        expect(coerceBoolean(null)).toBe(false);
        expect(coerceBoolean("")).toBe(false);
    });

    it("handles whitespace", () => {
        expect(coerceBoolean(" yes ")).toBe(true);
        expect(coerceBoolean(" no ")).toBe(false);
    });
});

describe("coerceInt", () => {
    it("parses valid integers", () => {
        expect(coerceInt("4")).toBe(4);
        expect(coerceInt("0")).toBe(0);
        expect(coerceInt(42)).toBe(42);
        expect(coerceInt("123")).toBe(123);
    });

    it("returns null for invalid values", () => {
        expect(coerceInt(undefined)).toBeNull();
        expect(coerceInt(null)).toBeNull();
        expect(coerceInt("")).toBeNull();
        expect(coerceInt("abc")).toBeNull();
        expect(coerceInt(NaN)).toBeNull();
    });

    it("truncates floats to integers", () => {
        expect(coerceInt("4.5")).toBe(4);
        expect(coerceInt("3.9")).toBe(3);
    });
});

describe("coerceFloat", () => {
    it("parses valid floats", () => {
        expect(coerceFloat("4.5")).toBe(4.5);
        expect(coerceFloat("500000")).toBe(500000);
        expect(coerceFloat("0.99")).toBe(0.99);
        expect(coerceFloat(11.2)).toBe(11.2);
    });

    it("returns null for invalid values", () => {
        expect(coerceFloat(undefined)).toBeNull();
        expect(coerceFloat(null)).toBeNull();
        expect(coerceFloat("")).toBeNull();
        expect(coerceFloat("abc")).toBeNull();
    });
});

describe("coerceString", () => {
    it("trims and returns strings", () => {
        expect(coerceString("hello")).toBe("hello");
        expect(coerceString("  hello  ")).toBe("hello");
    });

    it("converts numbers to strings", () => {
        expect(coerceString(42)).toBe("42");
    });

    it("returns null for empty/null/undefined", () => {
        expect(coerceString(undefined)).toBeNull();
        expect(coerceString(null)).toBeNull();
        expect(coerceString("")).toBeNull();
        expect(coerceString("   ")).toBeNull();
    });
});

describe("normaliseAreaUnit", () => {
    it("normalises squareMeter", () => {
        expect(normaliseAreaUnit("squareMeter")).toBe("sqm");
        expect(normaliseAreaUnit("sqm")).toBe("sqm");
    });

    it("preserves Australian square unit", () => {
        expect(normaliseAreaUnit("square")).toBe("square");
    });

    it("preserves acre and hectare", () => {
        expect(normaliseAreaUnit("acre")).toBe("acre");
        expect(normaliseAreaUnit("hectare")).toBe("hectare");
    });

    it("defaults to sqm for unknown units", () => {
        expect(normaliseAreaUnit(undefined)).toBe("sqm");
        expect(normaliseAreaUnit("unknown")).toBe("sqm");
    });

    it("is case-insensitive", () => {
        expect(normaliseAreaUnit("SquareMeter")).toBe("sqm");
        expect(normaliseAreaUnit("ACRE")).toBe("acre");
    });
});

describe("squaresToSqm", () => {
    it("converts squares to square metres", () => {
        expect(squaresToSqm(1)).toBe(SQUARE_TO_SQM);
        expect(squaresToSqm(40)).toBe(Math.round(40 * SQUARE_TO_SQM * 100) / 100);
    });

    it("returns 0 for 0", () => {
        expect(squaresToSqm(0)).toBe(0);
    });
});

describe("parseReaDate", () => {
    it("parses REAXML date format", () => {
        const date = parseReaDate("2009-01-01-12:30:00");
        expect(date).toBeInstanceOf(Date);
        expect(date!.getFullYear()).toBe(2009);
        expect(date!.getMonth()).toBe(0); // January
        expect(date!.getDate()).toBe(1);
    });

    it("returns null for invalid values", () => {
        expect(parseReaDate(undefined)).toBeNull();
        expect(parseReaDate(null)).toBeNull();
        expect(parseReaDate("")).toBeNull();
        expect(parseReaDate("not-a-date")).toBeNull();
    });

    it("handles standard ISO date format", () => {
        const date = parseReaDate("2009-01-01T12:30:00");
        expect(date).toBeInstanceOf(Date);
    });
});

describe("extractText", () => {
    it("returns plain string values", () => {
        expect(extractText("hello")).toBe("hello");
    });

    it("extracts #text from object nodes", () => {
        expect(extractText({ "#text": "500000", "@_display": "yes" })).toBe("500000");
    });

    it("handles numeric values", () => {
        expect(extractText(42)).toBe("42");
    });

    it("returns null for null/undefined", () => {
        expect(extractText(null)).toBeNull();
        expect(extractText(undefined)).toBeNull();
    });

    it("returns null for objects without #text", () => {
        expect(extractText({ "@_display": "yes" })).toBeNull();
    });
});
