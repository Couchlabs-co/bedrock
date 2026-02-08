/**
 * Shared API response types used across all endpoints.
 * Defines consistent pagination, filtering, and response shapes.
 */

/** Standard paginated response envelope */
export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

/** Pagination metadata returned with list responses */
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

/** Standard error response shape */
export interface ErrorResponse {
    error: string;
    code: string;
    details?: Record<string, string>;
}

/** Sort direction */
export type SortDirection = "asc" | "desc";

/** Allowed sort fields for listings */
export type ListingSortField = "price" | "date" | "relevance";

/** Listing search/filter parameters (from query string) */
export interface ListingSearchParams {
    q?: string;
    suburb?: string;
    postcode?: string;
    state?: string;
    propertyType?: string;
    listingType?: string;
    priceMin?: number;
    priceMax?: number;
    bedsMin?: number;
    bathsMin?: number;
    carsMin?: number;
    sort?: ListingSortField;
    order?: SortDirection;
    page?: number;
    limit?: number;
}

/** Nearby search parameters */
export interface NearbySearchParams {
    lat: number;
    lng: number;
    radiusKm?: number;
    propertyType?: string;
    listingType?: string;
    limit?: number;
    page?: number;
}

/** Suburb autocomplete result */
export interface SuburbResult {
    suburb: string;
    state: string;
    postcode: string;
}

/** Listing summary — returned in search results (list view) */
export interface ListingSummary {
    id: string;
    propertyType: string;
    category: string | null;
    listingType: string;
    status: string;
    headline: string | null;
    price: string | null;
    priceDisplay: boolean | null;
    priceView: string | null;
    rentAmount: string | null;
    rentPeriod: string | null;
    landArea: string | null;
    landAreaUnit: string | null;
    buildingArea: string | null;
    buildingAreaUnit: string | null;
    underOffer: boolean | null;
    isNewConstruction: boolean | null;
    auctionDate: Date | null;
    createdAt: Date;
    address: {
        suburb: string;
        state: string | null;
        postcode: string | null;
        formatted: string | null;
    } | null;
    features: {
        bedrooms: number | null;
        bathrooms: number | null;
        garages: number | null;
        carports: number | null;
    } | null;
    heroImage: {
        url: string;
        urlThumb: string | null;
    } | null;
}

/** Full listing detail — returned for single listing view */
export interface ListingDetail extends ListingSummary {
    description: string | null;
    authority: string | null;
    priceTax: string | null;
    rentDisplay: boolean | null;
    bond: string | null;
    dateAvailable: Date | null;
    commercialRent: string | null;
    outgoings: string | null;
    returnPercent: string | null;
    currentLeaseEnd: Date | null;
    carSpaces: number | null;
    zone: string | null;
    furtherOptions: string | null;
    frontage: string | null;
    energyRating: string | null;
    depositTaken: boolean | null;
    yearBuilt: number | null;
    yearRenovated: number | null;
    soldPrice: string | null;
    soldPriceDisplay: string | null;
    soldDate: Date | null;
    externalLink: string | null;
    videoLink: string | null;
    ruralFeatures: unknown;
    ecoFeatures: unknown;
    modTime: Date | null;
    allFeatures: AllFeatures | null;
    images: ListingImage[];
    inspections: ListingInspection[];
    agents: ListingAgentInfo[];
    agency: AgencyInfo | null;
}

/** All feature fields for detail view */
export interface AllFeatures {
    bedrooms: number | null;
    bathrooms: number | null;
    ensuites: number | null;
    garages: number | null;
    carports: number | null;
    openSpaces: number | null;
    toilets: number | null;
    livingAreas: number | null;
    airConditioning: boolean | null;
    alarmSystem: boolean | null;
    balcony: boolean | null;
    courtyard: boolean | null;
    deck: boolean | null;
    fullyFenced: boolean | null;
    intercom: boolean | null;
    openFireplace: boolean | null;
    outdoorEnt: boolean | null;
    poolInground: boolean | null;
    poolAbove: boolean | null;
    remoteGarage: boolean | null;
    secureParking: boolean | null;
    shed: boolean | null;
    spa: boolean | null;
    tennisCourt: boolean | null;
    vacuumSystem: boolean | null;
    heatingType: string | null;
    hotWaterType: string | null;
    otherFeatures: string | null;
    petFriendly: boolean | null;
    furnished: boolean | null;
    smokersAllowed: boolean | null;
}

/** Image in listing detail */
export interface ListingImage {
    id: string;
    type: string;
    sortOrder: number;
    url: string;
    urlThumb: string | null;
    urlMedium: string | null;
    urlLarge: string | null;
    format: string | null;
    title: string | null;
}

/** Inspection time in listing detail */
export interface ListingInspection {
    id: string;
    description: string;
    startsAt: Date | null;
    endsAt: Date | null;
}

/** Agent info in listing detail */
export interface ListingAgentInfo {
    name: string;
    email: string | null;
    phoneMobile: string | null;
    phoneOffice: string | null;
    position: number;
}

/** Agency info in listing detail */
export interface AgencyInfo {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
}
