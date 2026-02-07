/**
 * REAXML validator — validates ParsedListing objects using Zod schemas.
 * Enforces required fields, data constraints, and business rules.
 */

import { z } from "zod";
import type { ParsedListing } from "./types";

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

/** Phone number pattern that should NOT appear in descriptions */
const PHONE_PATTERN = /(?:\b(?:\+?61|0)\s*[2-9]\d{0,2}[\s-]?\d{3,4}[\s-]?\d{3,4}\b)/gi;

/** Address schema — required fields for current listings */
const addressSchema = z.object({
    street: z.string().min(1, "Street is required"),
    suburb: z.string().min(1, "Suburb is required"),
    state: z.string().nullable(),
    postcode: z.string().nullable(),
    country: z.string(),
});

/** Agent schema */
const agentSchema = z.object({
    name: z.string().min(1, "Agent name is required"),
    email: z.string().email().nullable(),
    position: z.number().int().positive(),
});

/** Base listing validation — applies to all listings */
const baseListingSchema = z.object({
    agentId: z.string().min(1, "Agent ID (agency code) is required"),
    uniqueId: z.string().min(1, "Unique ID is required"),
    propertyType: z.enum(["residential", "rental", "commercial", "land", "rural", "holidayRental"]),
    status: z.enum(["current", "withdrawn", "offmarket", "sold", "leased", "deleted"]),
    listingType: z.enum(["sale", "rent", "lease", "both"]),
});

// ============================================================
// VALIDATION RESULT TYPES
// ============================================================

/** Successful validation result */
export interface ValidationSuccess {
    valid: true;
    data: ParsedListing;
    warnings: string[];
}

/** Failed validation result */
export interface ValidationFailure {
    valid: false;
    errors: ValidationError[];
    warnings: string[];
}

/** A single validation error */
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

/** Union type for validation results */
export type ValidationResult = ValidationSuccess | ValidationFailure;

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Validate a ParsedListing against business rules and data constraints.
 *
 * @param listing - The parsed listing to validate
 * @returns Validation result with errors and/or warnings
 */
export function validateListing(listing: ParsedListing): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // 1. Base field validation
    validateBaseFields(listing, errors);

    // 2. Status-specific validation
    if (listing.status === "current") {
        validateCurrentListing(listing, errors, warnings);
    } else if (listing.status === "sold") {
        validateSoldListing(listing, errors, warnings);
    }

    // 3. Pricing validation
    validatePricing(listing, errors, warnings);

    // 4. Policy compliance
    validatePolicyCompliance(listing, errors, warnings);

    if (errors.length > 0) {
        return { valid: false, errors, warnings };
    }

    return { valid: true, data: listing, warnings };
}

/**
 * Validate a batch of listings and return results for each.
 *
 * @param listings - Array of parsed listings to validate
 * @returns Array of validation results (one per listing)
 */
export function validateListings(listings: ParsedListing[]): ValidationResult[] {
    return listings.map(validateListing);
}

// ============================================================
// VALIDATION RULES
// ============================================================

/** Validate required base fields present on all listings */
function validateBaseFields(listing: ParsedListing, errors: ValidationError[]): void {
    const result = baseListingSchema.safeParse(listing);

    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push({
                field: issue.path.join("."),
                message: issue.message,
                code: "INVALID_FIELD",
            });
        }
    }
}

/** Validate fields required for "current" (active) listings */
function validateCurrentListing(listing: ParsedListing, errors: ValidationError[], warnings: string[]): void {
    // Must have an address with street and suburb
    if (!listing.address) {
        errors.push({
            field: "address",
            message: "Address is required for active listings",
            code: "MISSING_ADDRESS",
        });
    } else {
        const addrResult = addressSchema.safeParse(listing.address);
        if (!addrResult.success) {
            for (const issue of addrResult.error.issues) {
                errors.push({
                    field: `address.${issue.path.join(".")}`,
                    message: issue.message,
                    code: "INVALID_ADDRESS",
                });
            }
        }
    }

    // Must have at least one agent
    if (listing.agents.length === 0) {
        errors.push({
            field: "agents",
            message: "At least one listing agent is required",
            code: "MISSING_AGENT",
        });
    } else {
        // Validate each agent
        for (let i = 0; i < listing.agents.length; i++) {
            const agentResult = agentSchema.safeParse(listing.agents[i]);
            if (!agentResult.success) {
                for (const issue of agentResult.error.issues) {
                    errors.push({
                        field: `agents[${i}].${issue.path.join(".")}`,
                        message: issue.message,
                        code: "INVALID_AGENT",
                    });
                }
            }
        }
    }

    // Warn if no description
    if (!listing.description) {
        warnings.push("Listing has no description");
    }

    // Warn if no headline
    if (!listing.headline) {
        warnings.push("Listing has no headline");
    }

    // Warn if no images
    if (listing.images.length === 0) {
        warnings.push("Listing has no images");
    }
}

/** Validate sold listing fields */
function validateSoldListing(listing: ParsedListing, _errors: ValidationError[], warnings: string[]): void {
    if (!listing.soldDetails) {
        warnings.push("Sold listing is missing sold details (price, date)");
    } else {
        if (listing.soldDetails.price === null) {
            warnings.push("Sold listing has no sold price");
        }

        if (listing.soldDetails.date === null) {
            warnings.push("Sold listing has no sold date");
        }
    }
}

/** Validate pricing fields */
function validatePricing(listing: ParsedListing, errors: ValidationError[], _warnings: string[]): void {
    if (listing.price !== null && listing.price < 0) {
        errors.push({
            field: "price",
            message: "Price cannot be negative",
            code: "INVALID_PRICE",
        });
    }

    if (listing.rentAmount !== null && listing.rentAmount < 0) {
        errors.push({
            field: "rentAmount",
            message: "Rent amount cannot be negative",
            code: "INVALID_RENT",
        });
    }

    if (listing.bond !== null && listing.bond < 0) {
        errors.push({
            field: "bond",
            message: "Bond cannot be negative",
            code: "INVALID_BOND",
        });
    }
}

/** Validate platform policy compliance */
function validatePolicyCompliance(listing: ParsedListing, _errors: ValidationError[], warnings: string[]): void {
    // Check for phone numbers in description (policy violation)
    if (listing.description) {
        const phoneMatches = listing.description.match(PHONE_PATTERN);
        if (phoneMatches) {
            warnings.push(
                `Description may contain phone number(s): ${phoneMatches.join(", ")}. ` +
                    "Contact information should only appear in agent details.",
            );
        }
    }

    // Check for email addresses in description
    if (listing.description) {
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emailMatches = listing.description.match(emailPattern);
        if (emailMatches) {
            warnings.push(
                `Description may contain email address(es): ${emailMatches.join(", ")}. ` +
                    "Contact information should only appear in agent details.",
            );
        }
    }
}
