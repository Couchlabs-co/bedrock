/**
 * Formatting utilities for price, date, and address display.
 */

/**
 * Format a numeric price for display.
 * @example formatPrice(500000) → "$500,000"
 * @example formatPrice(1250000) → "$1,250,000"
 */
export function formatPrice(amount: number | null | undefined): string {
    if (amount == null) {
        return "Price on request";
    }

    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format rent with period.
 * @example formatRent(550, "week") → "$550 /wk"
 */
export function formatRent(amount: number | null | undefined, period: string | null | undefined): string {
    if (amount == null) {
        return "Contact agent";
    }

    const suffix = period === "month" || period === "monthly" ? "/mo" : "/wk";
    return `${formatPrice(amount)} ${suffix}`;
}

/**
 * Format a date for display.
 * @example formatDate("2025-01-15T00:00:00Z") → "15 Jan 2025"
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (date == null) {
        return "";
    }

    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * Format land/building area with unit.
 * @example formatArea(450, "squareMeter") → "450 m²"
 */
export function formatArea(value: number | null | undefined, unit: string | null | undefined): string {
    if (value == null) {
        return "";
    }

    const unitMap: Record<string, string> = {
        squareMeter: "m²",
        sqm: "m²",
        square: "sq",
        acre: "acres",
        hectare: "ha",
    };

    const displayUnit = (unit && unitMap[unit]) ?? unit ?? "m²";
    return `${value.toLocaleString("en-AU")} ${displayUnit}`;
}
