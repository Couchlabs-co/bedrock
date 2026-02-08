/**
 * Tests for the REAXML mapper.
 * Verifies that ParsedListing objects are correctly transformed
 * into database insert shapes.
 */

import { describe, it, expect } from "vitest";
import { mapListingToDb, formatAddress } from "./mapper";
import type { ParsedListing, ParsedAddress } from "./types";

/** Create a minimal ParsedListing for testing */
function createTestListing(overrides: Partial<ParsedListing> = {}): ParsedListing {
    return {
        agentId: "XNWXNW",
        uniqueId: "TEST001",
        propertyType: "residential",
        category: "House",
        listingType: "sale",
        status: "current",
        authority: "exclusive",
        headline: "Test Listing",
        description: "A test property listing.",
        price: 500000,
        priceDisplay: true,
        priceView: "Offers over $500,000",
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
        buildingArea: 185.8,
        buildingAreaUnit: "sqm",
        frontage: 15,
        energyRating: 6.5,
        underOffer: false,
        isNewConstruction: false,
        isHomeLandPackage: false,
        depositTaken: false,
        yearBuilt: 2005,
        yearRenovated: null,
        auctionDate: null,
        modTime: new Date("2009-01-01T12:30:00"),
        soldDetails: null,
        externalLink: "http://example.com",
        videoLink: null,
        ruralFeatures: null,
        address: {
            display: true,
            siteName: null,
            subNumber: "2",
            lotNumber: null,
            streetNumber: "39",
            street: "Main Road",
            suburb: "RICHMOND",
            suburbDisplay: true,
            state: "vic",
            postcode: "3121",
            region: null,
            country: "AUS",
            municipality: "Yarra",
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
            remoteGarage: true,
            secureParking: false,
            airConditioning: true,
            alarmSystem: false,
            vacuumSystem: false,
            intercom: false,
            poolInground: true,
            poolAbove: false,
            tennisCourt: false,
            balcony: true,
            deck: false,
            courtyard: true,
            outdoorEnt: false,
            shed: true,
            fullyFenced: true,
            openFireplace: false,
            heatingType: "ducted",
            hotWaterType: "gas",
            insideSpa: false,
            outsideSpa: false,
            broadband: true,
            builtInRobes: true,
            dishwasher: true,
            ductedCooling: false,
            ductedHeating: true,
            evapCooling: false,
            floorboards: true,
            gasHeating: false,
            gym: false,
            hydronicHeating: false,
            payTv: false,
            reverseCycle: true,
            rumpusRoom: false,
            splitSystemAc: false,
            splitSystemHeat: false,
            study: true,
            workshop: false,
            otherFeatures: "garden, solar panels",
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
                modTime: new Date("2009-01-01"),
                sortOrder: 0,
            },
        ],
        inspections: [
            {
                description: "21-Jan-2009 11:00am to 1:00pm",
                startsAt: new Date("21 Jan 2009 11:00"),
                endsAt: new Date("21 Jan 2009 13:00"),
            },
        ],
        ...overrides,
    };
}

describe("mapListingToDb", () => {
    const agencyId = "agency-uuid-123";
    const listingId = "listing-uuid-456";

    it("produces correct listing insert shape", () => {
        const parsed = createTestListing();
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.listing.agencyId).toBe(agencyId);
        expect(mapped.listing.crmUniqueId).toBe("TEST001");
        expect(mapped.listing.crmAgentId).toBe("XNWXNW");
        expect(mapped.listing.propertyType).toBe("residential");
        expect(mapped.listing.status).toBe("current");
    });

    it("converts numeric fields to strings for Drizzle numeric columns", () => {
        const parsed = createTestListing();
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.listing.price).toBe("500000");
        expect(mapped.listing.landArea).toBe("600");
        expect(mapped.listing.buildingArea).toBe("185.8");
        expect(mapped.listing.frontage).toBe("15");
        expect(mapped.listing.energyRating).toBe("6.5");
    });

    it("handles null numeric fields", () => {
        const parsed = createTestListing({ price: null, landArea: null });
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.listing.price).toBeNull();
        expect(mapped.listing.landArea).toBeNull();
    });

    it("maps address with formatted string", () => {
        const parsed = createTestListing();
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.address).not.toBeNull();
        expect(mapped.address!.listingId).toBe(listingId);
        expect(mapped.address!.street).toBe("Main Road");
        expect(mapped.address!.suburb).toBe("RICHMOND");
        expect(mapped.address!.formatted).toBe("2/39 Main Road, RICHMOND VIC 3121");
    });

    it("maps features with listingId", () => {
        const parsed = createTestListing();
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.features).not.toBeNull();
        expect(mapped.features!.listingId).toBe(listingId);
        expect(mapped.features!.bedrooms).toBe(4);
        expect(mapped.features!.bathrooms).toBe(2);
        expect(mapped.features!.airConditioning).toBe(true);
    });

    it("maps images with listingId and sort order", () => {
        const parsed = createTestListing();
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.images).toHaveLength(1);
        expect(mapped.images[0]!.listingId).toBe(listingId);
        expect(mapped.images[0]!.type).toBe("photo");
        expect(mapped.images[0]!.sortOrder).toBe(0);
    });

    it("maps inspections with listingId", () => {
        const parsed = createTestListing();
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.inspections).toHaveLength(1);
        expect(mapped.inspections[0]!.listingId).toBe(listingId);
        expect(mapped.inspections[0]!.startsAt).toBeInstanceOf(Date);
    });

    it("maps agents with listingId", () => {
        const parsed = createTestListing();
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.agents).toHaveLength(1);
        expect(mapped.agents[0]!.listingId).toBe(listingId);
        expect(mapped.agents[0]!.name).toBe("Mr. John Doe");
        expect(mapped.agents[0]!.position).toBe(1);
    });

    it("handles null address", () => {
        const parsed = createTestListing({ address: null });
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.address).toBeNull();
    });

    it("handles null features", () => {
        const parsed = createTestListing({ features: null });
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.features).toBeNull();
    });

    it("handles sold details", () => {
        const parsed = createTestListing({
            status: "sold",
            soldDetails: {
                price: 520000,
                priceDisplay: "yes",
                date: new Date("2009-02-15"),
            },
        });
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.listing.soldPrice).toBe("520000");
        expect(mapped.listing.soldPriceDisplay).toBe("yes");
        expect(mapped.listing.soldDate).toBeInstanceOf(Date);
    });

    it("handles rural features as JSONB", () => {
        const ruralFeatures = {
            fencing: "Boundary fencing",
            annualRainfall: "250mm",
            soilTypes: "red basalt",
            improvements: null,
            councilRates: null,
            irrigation: null,
            carryingCapacity: null,
            services: null,
        };
        const parsed = createTestListing({ ruralFeatures });
        const mapped = mapListingToDb(parsed, agencyId, listingId);

        expect(mapped.listing.ruralFeatures).toEqual(ruralFeatures);
    });
});

describe("formatAddress", () => {
    it("formats a full address", () => {
        const addr: ParsedAddress = {
            display: true,
            siteName: null,
            subNumber: "2",
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
        };

        expect(formatAddress(addr)).toBe("2/39 Main Road, RICHMOND VIC 3121");
    });

    it("formats address without sub number", () => {
        const addr: ParsedAddress = {
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
        };

        expect(formatAddress(addr)).toBe("39 Main Road, RICHMOND VIC 3121");
    });

    it("formats address with lot number only", () => {
        const addr: ParsedAddress = {
            display: true,
            siteName: null,
            subNumber: null,
            lotNumber: "12",
            streetNumber: null,
            street: "Main Road",
            suburb: "RICHMOND",
            suburbDisplay: true,
            state: "vic",
            postcode: "3121",
            region: null,
            country: "AUS",
            municipality: null,
        };

        expect(formatAddress(addr)).toBe("Lot 12 Main Road, RICHMOND VIC 3121");
    });

    it("formats address without state or postcode", () => {
        const addr: ParsedAddress = {
            display: true,
            siteName: null,
            subNumber: null,
            lotNumber: null,
            streetNumber: "10",
            street: "High Street",
            suburb: "SOMEWHERE",
            suburbDisplay: true,
            state: null,
            postcode: null,
            region: null,
            country: "AUS",
            municipality: null,
        };

        expect(formatAddress(addr)).toBe("10 High Street, SOMEWHERE");
    });
});
