/**
 * REAXML value coercion utilities.
 * Handles the various truthy/falsy representations found in REAXML data:
 * yes/no, 1/0, true/false, and mixed formats.
 */

/** 1 Australian "square" = 9.29 square metres */
export const SQUARE_TO_SQM = 9.29;

/**
 * Coerce REAXML boolean values to boolean.
 * Handles: yes/no, 1/0, true/false, and mixed case.
 *
 * @param value - Raw REAXML value (string, number, boolean, or undefined)
 * @returns Coerced boolean value
 */
export function coerceBoolean(value: unknown): boolean {
    if (value === undefined || value === null || value === "") {
        return false;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value !== 0;
    }

    const str = String(value).toLowerCase().trim();
    return str === "yes" || str === "1" || str === "true";
}

/**
 * Coerce a value to an integer.
 *
 * @param value - Raw value to coerce
 * @returns Integer or null if invalid/empty
 */
export function coerceInt(value: unknown): number | null {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const num = parseInt(String(value), 10);
    return isNaN(num) ? null : num;
}

/**
 * Coerce a value to a float.
 *
 * @param value - Raw value to coerce
 * @returns Float or null if invalid/empty
 */
export function coerceFloat(value: unknown): number | null {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const num = parseFloat(String(value));
    return isNaN(num) ? null : num;
}

/**
 * Coerce a value to a trimmed string.
 *
 * @param value - Raw value to coerce
 * @returns Trimmed string or null if empty/undefined
 */
export function coerceString(value: unknown): string | null {
    if (value === undefined || value === null) {
        return null;
    }

    const str = String(value).trim();
    return str === "" ? null : str;
}

/**
 * Normalise REAXML area unit identifiers to a standard set.
 *
 * @param unit - Raw unit string from REAXML
 * @returns Normalised unit: sqm, square, acre, or hectare
 */
export function normaliseAreaUnit(unit: string | undefined): string {
    if (!unit) return "sqm";

    switch (unit.toLowerCase()) {
        case "squaremeter":
        case "sqm":
            return "sqm";
        case "square":
            return "square";
        case "acre":
            return "acre";
        case "hectare":
            return "hectare";
        default:
            return "sqm";
    }
}

/**
 * Convert an area value from Australian squares to square metres.
 *
 * @param value - Area in squares
 * @returns Area in square metres (rounded to 2 decimal places)
 */
export function squaresToSqm(value: number): number {
    return Math.round(value * SQUARE_TO_SQM * 100) / 100;
}

/**
 * Parse REAXML date format into a Date object.
 * REAXML uses "YYYY-MM-DD-HH:MM:SS" format (note the third hyphen).
 *
 * @param value - Raw date string from REAXML
 * @returns Parsed Date or null if invalid/empty
 */
export function parseReaDate(value: unknown): Date | null {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const str = String(value).trim();

    // REAXML format: "2009-01-01-12:30:00" → convert third hyphen to "T"
    const isoStr = str.replace(/^(\d{4}-\d{2}-\d{2})-(\d{2}:\d{2}:\d{2})$/, "$1T$2");

    const date = new Date(isoStr);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Extract text content from a fast-xml-parser node.
 * Handles both plain string values and objects with #text property.
 *
 * @param node - Parsed XML node (string, object with #text, or undefined)
 * @returns Text content or null
 */
export function extractText(node: unknown): string | null {
    if (node === undefined || node === null) return null;
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (typeof node === "object" && node !== null && "#text" in node) {
        return String((node as Record<string, unknown>)["#text"]);
    }
    return null;
}
