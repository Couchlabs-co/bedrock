/**
 * Tests for the REAXML validator.
 * Verifies validation rules for different listing states and types.
 */

import { describe, it, expect } from "vitest";
import { validateListing, validateListings } from "./validator";
import type { ParsedListing } from "./types";

/** Create a minimal valid current listing for testing */
function createValidListing(overrides: Partial<ParsedListing> = {}): ParsedListing {
    return {
        agentId: "XNWXNW",
        uniqueId: "TEST001",
        propertyType: "residential",
        category: "House",
        listingType: "sale",
        status: "current",
        authority: "exclusive",
        headline: "Test Listing",
        description: "A great property in a prime location.",
        price: 500000,
        priceDisplay: true,
        priceView: null,
        priceTax: "unknown",
        rentAmount: null,
        rentPeriod: null,
        rentDisplay: true,
        bond: null,
        dateAvailable: null,
        commercialRent: null,
        outgoings: null,
        returnPercent: null,
        currentLeaseEnd: null,
        tenancy: null,
        propertyExtent: null,
        carSpaces: null,
        zone: null,
        furtherOptions: null,
        landArea: 600,
        landAreaUnit: "sqm",
        buildingArea: 200,
        buildingAreaUnit: "sqm",
        frontage: null,
        energyRating: null,
        underOffer: false,
        isNewConstruction: false,
        isHomeLandPackage: false,
        depositTaken: false,
        yearBuilt: null,
        yearRenovated: null,
        auctionDate: null,
        modTime: new Date(),
        soldDetails: null,
        externalLink: null,
        videoLink: null,
        ruralFeatures: null,
        address: {
            display: true,
            siteName: null,
            subNumber: null,
            lotNumber: null,
            streetNumber: "39",
            street: "Main Road",
            suburb: "RICHMOND",
            suburbDisplay: true,
            state: "vic",
            postcode: "3121",
            region: null,
            country: "AUS",
            municipality: null,
        },
        features: {
            bedrooms: 4,
            bathrooms: 2,
            ensuites: 1,
            garages: 2,
            carports: 0,
            openSpaces: null,
            toilets: null,
            livingAreas: null,
            remoteGarage: false,
            secureParking: false,
            airConditioning: true,
            alarmSystem: false,
            vacuumSystem: false,
            intercom: false,
            poolInground: false,
            poolAbove: false,
            tennisCourt: false,
            balcony: false,
            deck: false,
            courtyard: false,
            outdoorEnt: false,
            shed: false,
            fullyFenced: true,
            openFireplace: false,
            heatingType: null,
            hotWaterType: null,
            insideSpa: false,
            outsideSpa: false,
            broadband: false,
            builtInRobes: false,
            dishwasher: false,
            ductedCooling: false,
            ductedHeating: false,
            evapCooling: false,
            floorboards: false,
            gasHeating: false,
            gym: false,
            hydronicHeating: false,
            payTv: false,
            reverseCycle: false,
            rumpusRoom: false,
            splitSystemAc: false,
            splitSystemHeat: false,
            study: false,
            workshop: false,
            otherFeatures: null,
            petFriendly: false,
            furnished: false,
            smokersAllowed: false,
        },
        agents: [
            {
                position: 1,
                name: "Mr. John Doe",
                email: "jdoe@test.com",
                phoneMobile: "05 1234 5678",
                phoneOffice: null,
                agentIdCode: "1",
                twitterUrl: null,
                facebookUrl: null,
                linkedinUrl: null,
            },
        ],
        images: [
            {
                type: "photo",
                originalId: "m",
                url: "http://example.com/main.jpg",
                format: "jpg",
                modTime: null,
                sortOrder: 0,
            },
        ],
        inspections: [],
        ...overrides,
    };
}

describe("validateListing", () => {
    describe("valid current listing", () => {
        it("passes validation with no errors", () => {
            const result = validateListing(createValidListing());
            expect(result.valid).toBe(true);
        });

        it("has no warnings for complete listing", () => {
            const result = validateListing(createValidListing());
            expect(result.warnings).toHaveLength(0);
        });
    });

    describe("missing required fields", () => {
        it("fails when agentId is empty", () => {
            const result = validateListing(createValidListing({ agentId: "" }));
            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.errors.some((e) => e.field === "agentId")).toBe(true);
            }
        });

        it("fails when uniqueId is empty", () => {
            const result = validateListing(createValidListing({ uniqueId: "" }));
            expect(result.valid).toBe(false);
        });

        it("fails when address is missing for current listing", () => {
            const result = validateListing(createValidListing({ address: null }));
            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.errors.some((e) => e.code === "MISSING_ADDRESS")).toBe(true);
            }
        });

        it("fails when agents are missing for current listing", () => {
            const result = validateListing(createValidListing({ agents: [] }));
            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.errors.some((e) => e.code === "MISSING_AGENT")).toBe(true);
            }
        });
    });

    describe("warnings", () => {
        it("warns when description is missing", () => {
            const result = validateListing(createValidListing({ description: null }));
            expect(result.valid).toBe(true);
            expect(result.warnings).toContain("Listing has no description");
        });

        it("warns when headline is missing", () => {
            const result = validateListing(createValidListing({ headline: null }));
            expect(result.valid).toBe(true);
            expect(result.warnings).toContain("Listing has no headline");
        });

        it("warns when images are missing", () => {
            const result = validateListing(createValidListing({ images: [] }));
            expect(result.valid).toBe(true);
            expect(result.warnings).toContain("Listing has no images");
        });
    });

    describe("pricing validation", () => {
        it("fails when price is negative", () => {
            const result = validateListing(createValidListing({ price: -1000 }));
            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.errors.some((e) => e.code === "INVALID_PRICE")).toBe(true);
            }
        });

        it("fails when rent is negative", () => {
            const result = validateListing(createValidListing({ rentAmount: -100 }));
            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.errors.some((e) => e.code === "INVALID_RENT")).toBe(true);
            }
        });

        it("fails when bond is negative", () => {
            const result = validateListing(createValidListing({ bond: -50 }));
            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.errors.some((e) => e.code === "INVALID_BOND")).toBe(true);
            }
        });

        it("allows null price", () => {
            const result = validateListing(createValidListing({ price: null }));
            expect(result.valid).toBe(true);
        });

        it("allows zero price", () => {
            const result = validateListing(createValidListing({ price: 0 }));
            expect(result.valid).toBe(true);
        });
    });

    describe("sold listing validation", () => {
        it("passes with sold details", () => {
            const result = validateListing(
                createValidListing({
                    status: "sold",
                    soldDetails: {
                        price: 520000,
                        priceDisplay: "yes",
                        date: new Date("2024-01-15"),
                    },
                }),
            );
            expect(result.valid).toBe(true);
        });

        it("warns when sold listing has no sold details", () => {
            const result = validateListing(
                createValidListing({
                    status: "sold",
                    soldDetails: null,
                }),
            );
            expect(result.valid).toBe(true);
            expect(result.warnings).toContain("Sold listing is missing sold details (price, date)");
        });

        it("does not require address for sold listing", () => {
            const result = validateListing(
                createValidListing({
                    status: "sold",
                    address: null,
                    agents: [],
                    soldDetails: {
                        price: 520000,
                        priceDisplay: "yes",
                        date: new Date("2024-01-15"),
                    },
                }),
            );
            expect(result.valid).toBe(true);
        });
    });

    describe("withdrawn listing validation", () => {
        it("passes with minimal data", () => {
            const result = validateListing(
                createValidListing({
                    status: "withdrawn",
                    address: null,
                    features: null,
                    agents: [],
                    images: [],
                    headline: null,
                    description: null,
                }),
            );
            expect(result.valid).toBe(true);
        });
    });

    describe("policy compliance", () => {
        it("warns about phone numbers in description", () => {
            const result = validateListing(
                createValidListing({
                    description: "Call the agent on 0412 345 678 for details",
                }),
            );
            expect(result.valid).toBe(true);
            expect(result.warnings.some((w) => w.includes("phone number"))).toBe(true);
        });

        it("warns about email addresses in description", () => {
            const result = validateListing(
                createValidListing({
                    description: "Email agent@example.com for details",
                }),
            );
            expect(result.valid).toBe(true);
            expect(result.warnings.some((w) => w.includes("email"))).toBe(true);
        });

        it("does not warn for clean descriptions", () => {
            const result = validateListing(
                createValidListing({
                    description: "Beautiful home in a great location. Close to schools and parks.",
                }),
            );
            expect(result.warnings.filter((w) => w.includes("phone") || w.includes("email"))).toHaveLength(0);
        });
    });
});

describe("validateListings", () => {
    it("validates multiple listings", () => {
        const results = validateListings([createValidListing(), createValidListing({ agentId: "" })]);
        expect(results).toHaveLength(2);
        expect(results[0].valid).toBe(true);
        expect(results[1].valid).toBe(false);
    });
});
