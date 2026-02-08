/**
 * Tests for the REAXML parser.
 * Uses the sample XML files in data/ to verify parsing accuracy.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseReaxml } from "./parser";

/** Helper to load sample XML from the data directory */
function loadSample(filename: string): string {
    return readFileSync(join(process.cwd(), "data", filename), "utf-8");
}

describe("parseReaxml", () => {
    it("throws on invalid XML without propertyList", () => {
        expect(() => parseReaxml("<root/>")).toThrow("Invalid REAXML: missing <propertyList> root element");
    });

    it("returns empty array for propertyList with no listings", () => {
        const result = parseReaxml('<?xml version="1.0"?><propertyList date="2009-01-01"></propertyList>');
        expect(result).toEqual([]);
    });
});

describe("residential parsing", () => {
    const xml = loadSample("residential_sample.xml");
    const listings = parseReaxml(xml);

    it("parses all listings from the file", () => {
        expect(listings).toHaveLength(3);
    });

    describe("current listing", () => {
        const listing = listings.find((l) => l.status === "current")!;

        it("extracts identifiers", () => {
            expect(listing.agentId).toBe("XNWXNW");
            expect(listing.uniqueId).toBe("ABCD1234");
        });

        it("sets property type and listing type", () => {
            expect(listing.propertyType).toBe("residential");
            expect(listing.listingType).toBe("sale");
        });

        it("extracts authority", () => {
            expect(listing.authority).toBe("exclusive");
        });

        it("extracts underOffer flag", () => {
            expect(listing.underOffer).toBe(false);
        });

        it("extracts newConstruction flag", () => {
            expect(listing.isNewConstruction).toBe(true);
        });

        it("extracts price fields", () => {
            expect(listing.price).toBe(500000);
            expect(listing.priceDisplay).toBe(true);
            expect(listing.priceView).toBe("Between $400,000 and $600,000");
        });

        it("extracts category", () => {
            expect(listing.category).toBe("House");
        });

        it("extracts headline and description", () => {
            expect(listing.headline).toBe("SHOW STOPPER!!!");
            expect(listing.description).toContain("Don't pass up an opportunity like this");
        });

        it("extracts modTime", () => {
            expect(listing.modTime).toBeInstanceOf(Date);
            expect(listing.modTime!.getFullYear()).toBe(2009);
        });

        it("extracts external link", () => {
            expect(listing.externalLink).toBe("http://www.realestate.com.au/");
        });

        describe("address", () => {
            it("extracts address fields", () => {
                expect(listing.address).not.toBeNull();
                expect(listing.address!.display).toBe(true);
                expect(listing.address!.subNumber).toBe("2");
                expect(listing.address!.streetNumber).toBe("39");
                expect(listing.address!.street).toBe("Main Road");
                expect(listing.address!.suburb).toBe("RICHMOND");
                expect(listing.address!.state).toBe("vic");
                expect(listing.address!.postcode).toBe("3121");
                expect(listing.address!.country).toBe("AUS");
            });

            it("extracts municipality", () => {
                expect(listing.address!.municipality).toBe("Yarra");
            });
        });

        describe("features", () => {
            it("extracts numeric features", () => {
                expect(listing.features).not.toBeNull();
                expect(listing.features!.bedrooms).toBe(4);
                expect(listing.features!.bathrooms).toBe(2);
                expect(listing.features!.ensuites).toBe(2);
                expect(listing.features!.garages).toBe(3);
                expect(listing.features!.carports).toBe(2);
            });

            it("coerces boolean features from yes/no", () => {
                expect(listing.features!.remoteGarage).toBe(true);
                expect(listing.features!.secureParking).toBe(true);
                expect(listing.features!.vacuumSystem).toBe(false);
                expect(listing.features!.intercom).toBe(false);
            });

            it("coerces boolean features from 1/0", () => {
                expect(listing.features!.airConditioning).toBe(true);
                expect(listing.features!.alarmSystem).toBe(true);
                expect(listing.features!.openFireplace).toBe(true);
            });

            it("extracts pool type", () => {
                expect(listing.features!.poolInground).toBe(true);
            });

            it("extracts boolean feature flags", () => {
                expect(listing.features!.tennisCourt).toBe(true);
                expect(listing.features!.balcony).toBe(true);
                expect(listing.features!.deck).toBe(true);
                expect(listing.features!.courtyard).toBe(true);
                expect(listing.features!.outdoorEnt).toBe(true);
                expect(listing.features!.shed).toBe(true);
                expect(listing.features!.fullyFenced).toBe(true);
            });

            it("extracts heating and hot water types", () => {
                expect(listing.features!.heatingType).toBe("other");
                expect(listing.features!.hotWaterType).toBe("gas");
            });

            it("extracts other features text", () => {
                expect(listing.features!.otherFeatures).toBe("balcony, courtyard, shed");
            });
        });

        describe("land and building", () => {
            it("extracts land area in sqm", () => {
                // 80 squareMeter → 80 sqm
                expect(listing.landArea).toBe(80);
                expect(listing.landAreaUnit).toBe("sqm");
            });

            it("converts building area from squares to sqm", () => {
                // 40 square → 40 * 9.2903 sqm
                expect(listing.buildingArea).toBeCloseTo(40 * 9.2903, 1);
                expect(listing.buildingAreaUnit).toBe("sqm");
            });

            it("extracts energy rating", () => {
                expect(listing.energyRating).toBe(4.5);
            });
        });

        describe("agents", () => {
            it("extracts listing agent", () => {
                expect(listing.agents).toHaveLength(1);
                expect(listing.agents[0]!.name).toBe("Mr. John Doe");
                expect(listing.agents[0]!.email).toBe("jdoe@somedomain.com.au");
                expect(listing.agents[0]!.phoneMobile).toBe("05 1234 5678");
                expect(listing.agents[0]!.position).toBe(1);
            });

            it("extracts agent social links", () => {
                expect(listing.agents[0]!.twitterUrl).toBe("https://www.twitter.com/JohnDoe");
            });
        });

        describe("images", () => {
            it("extracts photos", () => {
                const photos = listing.images.filter((i) => i.type === "photo");
                expect(photos).toHaveLength(2);
                expect(photos[0]!.originalId).toBe("m");
                expect(photos[0]!.url).toContain("imageM.jpg");
                expect(photos[0]!.format).toBe("jpg");
                expect(photos[0]!.sortOrder).toBe(0);
                expect(photos[1]!.originalId).toBe("a");
                expect(photos[1]!.sortOrder).toBe(1);
            });

            it("extracts floorplans", () => {
                const floorplans = listing.images.filter((i) => i.type === "floorplan");
                expect(floorplans).toHaveLength(2);
                expect(floorplans[0]!.url).toContain("floorplan1.gif");
            });
        });

        describe("inspections", () => {
            it("extracts inspection times", () => {
                expect(listing.inspections).toHaveLength(2);
                expect(listing.inspections[0]!.description).toBe("21-Jan-2009 11:00am to 1:00pm");
            });

            it("parses inspection start and end times", () => {
                const insp = listing.inspections[0]!;
                expect(insp.startsAt).toBeInstanceOf(Date);
                expect(insp.endsAt).toBeInstanceOf(Date);
            });
        });
    });

    describe("sold listing", () => {
        const sold = listings.find((l) => l.status === "sold")!;

        it("has sold status", () => {
            expect(sold.status).toBe("sold");
        });

        it("extracts sold details", () => {
            expect(sold.soldDetails).not.toBeNull();
            expect(sold.soldDetails!.price).toBe(580000);
            expect(sold.soldDetails!.priceDisplay).toBe("yes");
        });

        it("has no address (minimal sold notification)", () => {
            expect(sold.address).toBeNull();
        });
    });

    describe("withdrawn listing", () => {
        const withdrawn = listings.find((l) => l.status === "withdrawn")!;

        it("has withdrawn status", () => {
            expect(withdrawn.status).toBe("withdrawn");
        });

        it("has identifiers only", () => {
            expect(withdrawn.agentId).toBe("XNWXNW");
            expect(withdrawn.uniqueId).toBe("ABCD123456");
            expect(withdrawn.address).toBeNull();
        });
    });
});

describe("rental parsing", () => {
    const xml = loadSample("rental_sample.xml");
    const listings = parseReaxml(xml);

    it("parses all listings", () => {
        expect(listings).toHaveLength(3);
    });

    describe("current rental", () => {
        const rental = listings.find((l) => l.status === "current")!;

        it("sets listing type to rent", () => {
            expect(rental.propertyType).toBe("rental");
            expect(rental.listingType).toBe("rent");
        });

        it("extracts rent amount and period", () => {
            expect(rental.rentAmount).toBe(350);
            expect(rental.rentPeriod).toBe("week");
        });

        it("extracts bond amount", () => {
            expect(rental.bond).toBe(350);
        });

        it("extracts date available", () => {
            expect(rental.dateAvailable).toBeInstanceOf(Date);
        });

        it("extracts deposit taken flag", () => {
            expect(rental.depositTaken).toBe(false);
        });

        it("extracts newConstruction from boolean string", () => {
            expect(rental.isNewConstruction).toBe(true);
        });

        it("extracts rental allowances", () => {
            expect(rental.features!.petFriendly).toBe(true);
            expect(rental.features!.smokersAllowed).toBe(true);
            expect(rental.features!.furnished).toBe(true);
        });

        it("extracts agent social media links", () => {
            const agent = rental.agents[0]!;
            expect(agent.facebookUrl).toContain("facebook.com");
            expect(agent.linkedinUrl).toContain("linkedin.com");
        });
    });

    describe("leased listing", () => {
        const leased = listings.find((l) => l.status === "leased")!;

        it("has leased status", () => {
            expect(leased.status).toBe("leased");
        });
    });
});

describe("commercial parsing", () => {
    const xml = loadSample("commercial_sample.xml");
    const listings = parseReaxml(xml);

    it("parses all listings", () => {
        expect(listings).toHaveLength(3);
    });

    describe("current commercial listing", () => {
        const listing = listings.find((l) => l.status === "current")!;

        it("sets property and listing type", () => {
            expect(listing.propertyType).toBe("commercial");
            expect(listing.listingType).toBe("sale");
        });

        it("extracts commercial authority and category", () => {
            expect(listing.authority).toBe("auction");
            expect(listing.category).toBe("Other");
        });

        it("extracts commercial rent", () => {
            expect(listing.commercialRent).toBe(10000);
        });

        it("extracts outgoings", () => {
            expect(listing.outgoings).toBe(3000);
        });

        it("extracts return percentage", () => {
            expect(listing.returnPercent).toBe(11.2);
        });

        it("extracts currentLeaseEndDate", () => {
            expect(listing.currentLeaseEnd).toBeInstanceOf(Date);
        });

        it("extracts car spaces", () => {
            expect(listing.carSpaces).toBe(12);
        });

        it("extracts zone", () => {
            expect(listing.zone).toBe("Industrial");
        });

        it("extracts further options", () => {
            expect(listing.furtherOptions).toBe("store room");
        });

        it("extracts multiple listing agents", () => {
            expect(listing.agents).toHaveLength(2);
            expect(listing.agents[0]!.name).toBe("Mr. John Doe");
            expect(listing.agents[1]!.name).toBe("Mrs. Jane Doe");
            expect(listing.agents[0]!.position).toBe(1);
            expect(listing.agents[1]!.position).toBe(2);
        });

        it("extracts auction date", () => {
            expect(listing.auctionDate).toBeInstanceOf(Date);
        });
    });
});

describe("land parsing", () => {
    const xml = loadSample("land_sample.xml");
    const listings = parseReaxml(xml);

    it("parses all listings", () => {
        expect(listings).toHaveLength(3);
    });

    describe("current land listing", () => {
        const listing = listings.find((l) => l.status === "current")!;

        it("sets correct property type", () => {
            expect(listing.propertyType).toBe("land");
            expect(listing.listingType).toBe("sale");
        });

        it("extracts land category", () => {
            expect(listing.category).toBe("Residential");
        });

        it("extracts lot number in address", () => {
            expect(listing.address!.lotNumber).toBe("12");
        });

        it("extracts price fields", () => {
            expect(listing.price).toBe(80000);
            expect(listing.priceDisplay).toBe(true);
            expect(listing.priceView).toBe("To suit buyers 60K+");
        });

        it("converts land area from squares to sqm", () => {
            // 60 square → sqm
            expect(listing.landArea).toBeCloseTo(60 * 9.2903, 1);
            expect(listing.landAreaUnit).toBe("sqm");
        });

        it("extracts frontage", () => {
            expect(listing.frontage).toBe(20);
        });
    });
});

describe("rural parsing", () => {
    const xml = loadSample("rural_sample.xml");
    const listings = parseReaxml(xml);

    it("parses all listings", () => {
        expect(listings).toHaveLength(3);
    });

    describe("current rural listing", () => {
        const listing = listings.find((l) => l.status === "current")!;

        it("sets correct property type", () => {
            expect(listing.propertyType).toBe("rural");
            expect(listing.listingType).toBe("sale");
        });

        it("extracts rural category", () => {
            expect(listing.category).toBe("Cropping");
        });

        it("extracts price with display=no", () => {
            expect(listing.price).toBe(400000);
            expect(listing.priceDisplay).toBe(false);
        });

        it("extracts land area in acres", () => {
            expect(listing.landArea).toBe(50);
            expect(listing.landAreaUnit).toBe("acre");
        });

        it("extracts rural features", () => {
            expect(listing.ruralFeatures).not.toBeNull();
            expect(listing.ruralFeatures!.fencing).toContain("Boundary");
            expect(listing.ruralFeatures!.annualRainfall).toContain("250");
            expect(listing.ruralFeatures!.soilTypes).toBe("red basalt");
            expect(listing.ruralFeatures!.improvements).toContain("Shearing shed");
            expect(listing.ruralFeatures!.councilRates).toContain("$2,200");
            expect(listing.ruralFeatures!.irrigation).toContain("Electric pump");
            expect(listing.ruralFeatures!.carryingCapacity).toContain("400 Deer");
            expect(listing.ruralFeatures!.services).toContain("Power");
        });

        it("extracts agent Facebook URL", () => {
            expect(listing.agents[0]!.facebookUrl).toContain("facebook.com");
        });
    });
});
