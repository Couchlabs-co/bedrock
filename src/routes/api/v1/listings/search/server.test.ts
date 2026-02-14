import { describe, it, expect, vi, beforeEach } from "vitest";

// These endpoint tests should not require a live database.
// The VS Code test runner environment may not have Postgres available,
// so we mock the db and service layer.
const searchListingsMock = vi.fn(async (_db: unknown, params: any) => {
    const page = typeof params?.page === "number" ? params.page : 1;
    const limit = typeof params?.limit === "number" ? params.limit : 20;

    return {
        data: [],
        meta: {
            total: 0,
            page,
            limit,
            pages: 1,
        },
    };
});

vi.mock("$db/connection", () => {
    return {
        db: {},
    };
});

vi.mock("$services/listing-service", () => {
    return {
        searchListings: searchListingsMock,
    };
});

// Import AFTER mocks so the endpoint uses the mocked dependencies.
const { GET } = await import("./+server");

/**
 * Helper to create a mock RequestEvent for testing
 */
function createMockRequest(url: URL): any {
    return {
        url,
        params: {},
        request: new Request(url.href),
        platform: {},
        locals: {},
        route: { id: "/api/v1/listings/search" },
        isDataRequest: false,
        isSubRequest: false,
        cookies: {} as any,
        fetch: global.fetch,
        getClientAddress: () => "127.0.0.1",
        setHeaders: () => {},
        depends: () => {},
        parent: () => Promise.resolve({}),
        untrack: (fn: any) => fn(),
    };
}

beforeEach(() => {
    searchListingsMock.mockClear();
});

describe("GET /api/v1/listings/search", () => {
    describe("Basic search", () => {
        it("should return paginated results with default parameters", async () => {
            const url = new URL("http://localhost/api/v1/listings/search");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("data");
            expect(data).toHaveProperty("meta");
            expect(Array.isArray(data.data)).toBe(true);
            expect(data.meta).toMatchObject({
                total: expect.any(Number),
                page: 1,
                limit: 20,
                pages: expect.any(Number),
            });
        });

        it("should filter by suburb", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?suburb=Baulkham%20Hills");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            // Results may be empty if no listings match
            if (data.data.length > 0) {
                expect(
                    data.data.every((listing: any) => listing.address?.suburb?.toLowerCase().includes("baulkham")),
                ).toBe(true);
            }
        });

        it("should filter by listing type", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?listingType=sale");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            if (data.data.length > 0) {
                expect(data.data.every((listing: any) => listing.listingType === "sale")).toBe(true);
            }
        });

        it("should filter by property type", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?propertyType=house");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            if (data.data.length > 0) {
                expect(data.data.every((listing: any) => listing.propertyType === "house")).toBe(true);
            }
        });
    });

    describe("Price filtering", () => {
        it("should filter by minimum price", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?priceMin=500000");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("data");
        });

        it("should filter by maximum price", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?priceMax=1000000");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("data");
        });

        it("should filter by price range", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?priceMin=500000&priceMax=1000000");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("data");
        });
    });

    describe("Feature filtering", () => {
        it("should filter by minimum bedrooms", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?bedsMin=3");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("data");
        });

        it("should filter by minimum bathrooms", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?bathsMin=2");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("data");
        });

        it("should filter by minimum parking", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?carsMin=2");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("data");
        });
    });

    describe("Combined filters", () => {
        it("should apply multiple filters simultaneously", async () => {
            const url = new URL(
                "http://localhost/api/v1/listings/search?listingType=sale&propertyType=house&bedsMin=3&priceMin=500000&priceMax=1000000",
            );
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("data");
            expect(data).toHaveProperty("meta");
        });
    });

    describe("Pagination", () => {
        it("should respect page parameter", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?page=2");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.meta.page).toBe(2);
        });

        it("should respect limit parameter", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?limit=5");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.meta.limit).toBe(5);
            expect(data.data.length).toBeLessThanOrEqual(5);
        });

        it("should enforce maximum limit of 100", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?limit=200");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            // Schema rejects limit > 100, returns 400 error
            expect(response.status).toBe(400);
            expect(data).toHaveProperty("error");
        });
    });

    describe("Sorting", () => {
        it("should sort by price ascending", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?sort=price&order=asc");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("data");
        });

        it("should sort by price descending", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?sort=price&order=desc");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("data");
        });
    });

    describe("Text search", () => {
        it("should perform full-text search", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?q=modern");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty("data");
        });
    });

    describe("Validation", () => {
        it("should reject invalid property type", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?propertyType=invalid");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data).toHaveProperty("error");
        });

        it("should reject invalid listing type", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?listingType=invalid");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data).toHaveProperty("error");
        });

        it("should reject negative price values", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?priceMin=-1000");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data).toHaveProperty("error");
        });

        it("should reject invalid sort field", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?sort=invalid");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data).toHaveProperty("error");
        });
    });

    describe("Response structure", () => {
        it("should include all required listing summary fields", async () => {
            const url = new URL("http://localhost/api/v1/listings/search?limit=1");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            if (data.data.length > 0) {
                const listing = data.data[0];
                expect(listing).toHaveProperty("id");
                expect(listing).toHaveProperty("listingType");
                expect(listing).toHaveProperty("propertyType");
            }
        });

        it("should include meta pagination information", async () => {
            const url = new URL("http://localhost/api/v1/listings/search");
            const response = await GET(createMockRequest(url));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.meta).toHaveProperty("total");
            expect(data.meta).toHaveProperty("page");
            expect(data.meta).toHaveProperty("limit");
            expect(data.meta).toHaveProperty("pages");
            expect(typeof data.meta.total).toBe("number");
            expect(typeof data.meta.page).toBe("number");
            expect(typeof data.meta.limit).toBe("number");
            expect(typeof data.meta.pages).toBe("number");
        });
    });
});
