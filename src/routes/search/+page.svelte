<!--
    Search Results Page — SSR listing search with filters, sort, grid/list toggle, and pagination.
    URL-driven: all filters are reflected in query params for shareability and SEO.
-->
<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import type { SuburbResult } from "$types/api";
    import type { FilterState } from "$types/search";
    import ListingCard from "$lib/components/listing/ListingCard.svelte";
    import SuburbAutocomplete from "$lib/components/search/SuburbAutocomplete.svelte";
    import SearchFilters from "$lib/components/search/SearchFilters.svelte";

    interface Props {
        data: import("./$types").PageData;
    }

    let { data }: Props = $props();

    /** Layout toggle: grid or list */
    let viewLayout = $state<"grid" | "list">("grid");

    /** Mobile filter panel toggle */
    let filtersOpen = $state(false);

    /** Build the current filter state from URL params */
    let currentFilters = $derived({
        propertyType: $page.url.searchParams.get("propertyType") ?? "",
        listingType: $page.url.searchParams.get("listingType") ?? "",
        priceMin: $page.url.searchParams.get("priceMin") ?? "",
        priceMax: $page.url.searchParams.get("priceMax") ?? "",
        bedsMin: $page.url.searchParams.get("bedsMin") ?? "",
        bathsMin: $page.url.searchParams.get("bathsMin") ?? "",
        carsMin: $page.url.searchParams.get("carsMin") ?? "",
        sort: $page.url.searchParams.get("sort") ?? "date",
        order: $page.url.searchParams.get("order") ?? "desc",
    });

    /** Current search query text */
    let searchQuery = $derived($page.url.searchParams.get("q") ?? "");

    /** Current page number */
    let currentPage = $derived(Number($page.url.searchParams.get("page") ?? "1"));

    /**
     * Navigate with updated query params, preserving existing ones.
     */
    function updateSearch(updates: Record<string, string>): void {
        // eslint-disable-next-line svelte/prefer-svelte-reactivity -- non-reactive local usage
        const params = new URLSearchParams($page.url.search);

        for (const [key, value] of Object.entries(updates)) {
            if (value === "" || value === undefined) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        }

        // Reset to page 1 when filters change (except pagination itself)
        if (!("page" in updates)) {
            params.delete("page");
        }

        goto(`/search?${params.toString()}`, { keepFocus: true });
    }

    /**
     * Handle suburb selection from autocomplete.
     */
    function handleSuburbSelect(suburb: SuburbResult): void {
        updateSearch({
            q: "",
            suburb: suburb.suburb,
            postcode: suburb.postcode,
            state: suburb.state,
        });
    }

    /**
     * Handle search text submission.
     */
    function handleSearchSubmit(e: SubmitEvent): void {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const q = formData.get("q") as string;
        updateSearch({ q, suburb: "", postcode: "", state: "" });
    }

    /**
     * Handle filter changes from the sidebar.
     */
    function handleFilterChange(newFilters: FilterState): void {
        updateSearch(newFilters as unknown as Record<string, string>);
        filtersOpen = false;
    }

    /**
     * Navigate to a specific page.
     */
    function goToPage(pageNum: number): void {
        updateSearch({ page: String(pageNum) });
    }

    /** Generate page numbers for pagination */
    let pageNumbers = $derived.by(() => {
        const total = data.listings.meta.pages;
        const current = currentPage;
        const pages: (number | "ellipsis")[] = [];

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
            return pages;
        }

        pages.push(1);
        if (current > 3) pages.push("ellipsis");

        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);

        for (let i = start; i <= end; i++) pages.push(i);

        if (current < total - 2) pages.push("ellipsis");
        pages.push(total);

        return pages;
    });

    /** Active filter count for mobile badge */
    let activeFilterCount = $derived(
        [
            currentFilters.propertyType,
            currentFilters.listingType,
            currentFilters.priceMin,
            currentFilters.priceMax,
            currentFilters.bedsMin,
            currentFilters.bathsMin,
            currentFilters.carsMin,
        ].filter((v) => v !== "").length,
    );

    /** Page title for SEO */
    let pageTitle = $derived.by(() => {
        const parts: string[] = [];
        const suburb = $page.url.searchParams.get("suburb");
        const listing = $page.url.searchParams.get("listingType");

        if (listing === "rent") parts.push("Rentals");
        else if (listing === "sale") parts.push("Properties for sale");
        else parts.push("Properties");

        if (suburb) parts.push(`in ${suburb}`);

        return parts.join(" ");
    });

    /** Whether the user is authenticated */
    let isAuthenticated = $derived(!!data.user);
</script>

<svelte:head>
    <title>{pageTitle} | LOCATION</title>
    <meta name="description" content="Search {pageTitle.toLowerCase()} across Australia on LOCATION." />
</svelte:head>

<div class="search-page">
    <!-- Search bar -->
    <div class="search-bar-section">
        <div class="container">
            <form class="search-bar" onsubmit={handleSearchSubmit} role="search" aria-label="Property search">
                <SuburbAutocomplete
                    value={searchQuery || $page.url.searchParams.get("suburb") || ""}
                    onSelect={handleSuburbSelect}
                    name="q"
                    id="search-page-input"
                    className="search-bar-input"
                />
                <button type="submit" class="btn btn-primary btn-lg search-submit"> Search </button>
            </form>
        </div>
    </div>

    <div class="container search-layout">
        <!-- Filters sidebar (desktop) -->
        <SearchFilters
            filters={currentFilters}
            onFilterChange={handleFilterChange}
            mobileOpen={filtersOpen}
            onClose={() => {
                filtersOpen = false;
            }}
        />

        <!-- Results area -->
        <div class="results-area">
            <!-- Results header -->
            <div class="results-header">
                <div class="results-meta">
                    <h1 class="results-title">{pageTitle}</h1>
                    <p class="results-count">
                        {data.listings.meta.total.toLocaleString()}
                        {data.listings.meta.total === 1 ? "result" : "results"}
                    </p>
                </div>

                <div class="results-actions">
                    <!-- Mobile filter toggle -->
                    <button
                        class="btn btn-outline btn-sm filter-toggle"
                        onclick={() => {
                            filtersOpen = true;
                        }}
                        aria-label="Open filters"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        >
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="8" y1="12" x2="20" y2="12" />
                            <line x1="12" y1="18" x2="20" y2="18" />
                        </svg>
                        Filters
                        {#if activeFilterCount > 0}
                            <span class="filter-badge">{activeFilterCount}</span>
                        {/if}
                    </button>

                    <!-- View layout toggle -->
                    <div class="view-toggle" role="radiogroup" aria-label="Results layout">
                        <button
                            class="btn-icon"
                            class:active={viewLayout === "grid"}
                            onclick={() => {
                                viewLayout = "grid";
                            }}
                            aria-label="Grid view"
                            aria-pressed={viewLayout === "grid"}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                        </button>
                        <button
                            class="btn-icon"
                            class:active={viewLayout === "list"}
                            onclick={() => {
                                viewLayout = "list";
                            }}
                            aria-label="List view"
                            aria-pressed={viewLayout === "list"}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Listing cards -->
            {#if data.listings.data.length === 0}
                <div class="no-results">
                    <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <h2>No properties found</h2>
                    <p>Try adjusting your search or filters to find what you're looking for.</p>
                </div>
            {:else}
                <div class="results-grid" class:list-view={viewLayout === "list"}>
                    {#each data.listings.data as listing (listing.id)}
                        <ListingCard {listing} layout={viewLayout} {isAuthenticated} />
                    {/each}
                </div>
            {/if}

            <!-- Pagination -->
            {#if data.listings.meta.pages > 1}
                <nav class="pagination" aria-label="Search results pages">
                    <button
                        class="btn btn-outline btn-sm"
                        disabled={currentPage <= 1}
                        onclick={() => goToPage(currentPage - 1)}
                        aria-label="Previous page"
                    >
                        &laquo; Prev
                    </button>

                    <div class="page-numbers">
                        {#each pageNumbers as p, i (i)}
                            {#if p === "ellipsis"}
                                <span class="page-ellipsis" aria-hidden="true">&hellip;</span>
                            {:else}
                                <button
                                    class="page-btn"
                                    class:active={p === currentPage}
                                    onclick={() => goToPage(p)}
                                    aria-label="Page {p}"
                                    aria-current={p === currentPage ? "page" : undefined}
                                >
                                    {p}
                                </button>
                            {/if}
                        {/each}
                    </div>

                    <button
                        class="btn btn-outline btn-sm"
                        disabled={currentPage >= data.listings.meta.pages}
                        onclick={() => goToPage(currentPage + 1)}
                        aria-label="Next page"
                    >
                        Next &raquo;
                    </button>
                </nav>
            {/if}
        </div>
    </div>
</div>

<style>
    .search-page {
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - var(--header-height));
    }

    /* Search bar section */
    .search-bar-section {
        background: var(--color-bg-secondary);
        padding: var(--space-4) 0;
        border-bottom: 1px solid var(--color-border-light);
    }

    .search-bar {
        display: flex;
        align-items: stretch;
        gap: var(--space-2);
        max-width: 640px;
        margin-inline: auto;
    }

    :global(.search-bar-input) {
        flex: 1;
    }

    :global(.search-bar-input input) {
        height: 100%;
        box-sizing: border-box;
    }

    .search-submit {
        flex-shrink: 0;
    }

    /* Layout */
    .search-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: var(--space-6);
        padding-top: var(--space-6);
        padding-bottom: var(--space-10);
        align-items: start;
    }

    /* Results area */
    .results-area {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
    }

    .results-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-4);
        flex-wrap: wrap;
    }

    .results-title {
        font-size: 1.25rem;
        font-weight: 700;
    }

    .results-count {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        margin-top: var(--space-1);
    }

    .results-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    /* Filter toggle (mobile only) */
    .filter-toggle {
        display: none;
    }

    .filter-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: var(--radius-full);
        background: var(--color-primary);
        color: white;
        font-size: 0.6875rem;
        font-weight: 700;
    }

    /* View toggle */
    .view-toggle {
        display: flex;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        overflow: hidden;
    }

    .view-toggle .btn-icon {
        border-radius: 0;
        color: var(--color-text-secondary);
    }

    .view-toggle .btn-icon:hover {
        background: var(--color-bg-secondary);
    }

    .view-toggle .btn-icon.active {
        background: var(--color-primary-light);
        color: var(--color-primary);
    }

    /* Results grid */
    .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--space-4);
    }

    .results-grid.list-view {
        grid-template-columns: 1fr;
    }

    /* No results */
    .no-results {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: var(--space-16) var(--space-4);
        color: var(--color-text-secondary);
    }

    .no-results svg {
        margin-bottom: var(--space-4);
        color: var(--color-text-tertiary);
    }

    .no-results h2 {
        font-size: 1.25rem;
        margin-bottom: var(--space-2);
        color: var(--color-text);
    }

    /* Pagination */
    .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding-top: var(--space-6);
        border-top: 1px solid var(--color-border-light);
    }

    .page-numbers {
        display: flex;
        align-items: center;
        gap: var(--space-1);
    }

    .page-btn {
        min-width: 36px;
        height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text);
        transition:
            background var(--transition-base),
            color var(--transition-base);
    }

    .page-btn:hover {
        background: var(--color-bg-secondary);
    }

    .page-btn.active {
        background: var(--color-primary);
        color: white;
    }

    .page-ellipsis {
        padding: 0 var(--space-1);
        color: var(--color-text-tertiary);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .search-layout {
            grid-template-columns: 1fr;
        }

        .filter-toggle {
            display: inline-flex;
        }

        .results-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 480px) {
        .search-bar {
            flex-direction: column;
        }
    }
</style>
