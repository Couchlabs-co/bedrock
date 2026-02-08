/**
 * Shared types for the search/filter UI components.
 */

/** Filter state shape used by SearchFilters and the search page. */
export interface FilterState {
    propertyType: string;
    listingType: string;
    priceMin: string;
    priceMax: string;
    bedsMin: string;
    bathsMin: string;
    carsMin: string;
    sort: string;
    order: string;
}
