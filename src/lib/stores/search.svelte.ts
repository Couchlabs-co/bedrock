/**
 * Search store — manages cached search results from home page to search page.
 * Provides instant navigation by storing both criteria and listings temporarily.
 */

import { browser } from "$app/environment";
import type { ParsedSearchCriteria, PaginatedResponse, ListingSummary } from "$types/api";

interface SearchState
{
    criteria: ParsedSearchCriteria | null;
    listings: PaginatedResponse<ListingSummary> | null;
    originalQuery: string | null;
    confidence: "high" | "medium" | "low" | null;
    timestamp: number | null;
}

let state = $state<SearchState>({
    criteria: null,
    listings: null,
    originalQuery: null,
    confidence: null,
    timestamp: null,
});

const STATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Set search state after successful parse API call.
 * Stores criteria, listings, and metadata for instant search page display.
 */
export function setSearchState(
    criteria: ParsedSearchCriteria,
    listings: PaginatedResponse<ListingSummary>,
    originalQuery: string,
    confidence: "high" | "medium" | "low",
): void
{
    if (!browser) return;

    state = {
        criteria,
        listings,
        originalQuery,
        confidence,
        timestamp: Date.now(),
    };
}

/**
 * Get current search state if available and fresh.
 * Returns null if state is missing, expired, or stale.
 */
export function getSearchState(): SearchState | null
{
    if (!browser || !state.timestamp) return null;

    if (!isSearchStateFresh())
    {
        clearSearchState();
        return null;
    }

    return state;
}

/**
 * Check if search state is still fresh (within TTL).
 */
export function isSearchStateFresh(): boolean
{
    if (!browser || !state.timestamp) return false;
    return Date.now() - state.timestamp < STATE_TTL_MS;
}

/**
 * Clear search state.
 * Called after consuming state or when state becomes stale.
 */
export function clearSearchState(): void
{
    if (!browser) return;

    state = {
        criteria: null,
        listings: null,
        originalQuery: null,
        confidence: null,
        timestamp: null,
    };
}
