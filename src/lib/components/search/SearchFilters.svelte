<!--
    SearchFilters — Sidebar filter panel for the search results page.
    Controls property type, listing type, price range, beds/baths/cars, and sort.
    Syncs with URL params; emits changes via onFilterChange callback.
-->
<script lang="ts">
    import type { FilterState } from "$types/search";

    interface Props {
        /** Current filter values */
        filters: FilterState;
        /** Callback when any filter changes */
        onFilterChange: (filters: FilterState) => void;
        /** Whether the filter panel is visible on mobile */
        mobileOpen?: boolean;
        /** Callback to close the mobile filter panel */
        onClose?: () => void;
    }

    let { filters, onFilterChange, mobileOpen = false, onClose }: Props = $props();

    /** Local copy of filters for two-way binding within the panel */
    // eslint-disable-next-line svelte/prefer-writable-derived -- local needs mutation via bind:value
    let local = $state<FilterState>({
        propertyType: "",
        listingType: "",
        priceMin: "",
        priceMax: "",
        bedsMin: "",
        bathsMin: "",
        carsMin: "",
        sort: "date",
        order: "desc",
    });

    /** Sync local state when external filters prop changes */
    $effect(() => {
        local = { ...filters };
    });

    /** Property type options */
    const propertyTypes = [
        { value: "", label: "All types" },
        { value: "residential", label: "House" },
        { value: "rental", label: "Rental" },
        { value: "commercial", label: "Commercial" },
        { value: "land", label: "Land" },
        { value: "rural", label: "Rural" },
    ] as const;

    /** Listing type options */
    const listingTypes = [
        { value: "", label: "Buy or Rent" },
        { value: "sale", label: "Buy" },
        { value: "rent", label: "Rent" },
        { value: "lease", label: "Lease" },
    ] as const;

    /** Bed/bath/car options */
    const countOptions = [
        { value: "", label: "Any" },
        { value: "1", label: "1+" },
        { value: "2", label: "2+" },
        { value: "3", label: "3+" },
        { value: "4", label: "4+" },
        { value: "5", label: "5+" },
    ] as const;

    /** Sort options */
    const sortOptions = [
        { value: "date", label: "Newest" },
        { value: "price", label: "Price" },
        { value: "relevance", label: "Relevance" },
    ] as const;

    /**
     * Handle a filter value change and emit the updated state.
     */
    function handleChange(): void {
        onFilterChange({ ...local });
    }

    /**
     * Reset all filters to defaults.
     */
    function resetFilters(): void {
        local = {
            propertyType: "",
            listingType: "",
            priceMin: "",
            priceMax: "",
            bedsMin: "",
            bathsMin: "",
            carsMin: "",
            sort: "date",
            order: "desc",
        };
        onFilterChange({ ...local });
    }

    /** Whether any non-default filter is active */
    let hasActiveFilters = $derived(
        local.propertyType !== "" ||
            local.listingType !== "" ||
            local.priceMin !== "" ||
            local.priceMax !== "" ||
            local.bedsMin !== "" ||
            local.bathsMin !== "" ||
            local.carsMin !== "",
    );
</script>

<aside class="search-filters" class:mobile-open={mobileOpen} aria-label="Search filters">
    <div class="filters-header">
        <h2 class="filters-title">Filters</h2>
        <div class="filters-header-actions">
            {#if hasActiveFilters}
                <button class="btn btn-ghost btn-sm" onclick={resetFilters}> Clear all </button>
            {/if}
            {#if onClose}
                <button class="btn-icon close-btn" onclick={onClose} aria-label="Close filters">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            {/if}
        </div>
    </div>

    <!-- Property type -->
    <fieldset class="filter-group">
        <legend class="filter-label">Property type</legend>
        <select
            bind:value={local.propertyType}
            onchange={handleChange}
            class="filter-select"
            aria-label="Property type"
        >
            {#each propertyTypes as opt (opt.value)}
                <option value={opt.value}>{opt.label}</option>
            {/each}
        </select>
    </fieldset>

    <!-- Listing type -->
    <fieldset class="filter-group">
        <legend class="filter-label">Listing type</legend>
        <div class="filter-tabs" role="radiogroup" aria-label="Listing type">
            {#each listingTypes as opt (opt.value)}
                <label class="filter-tab" class:active={local.listingType === opt.value}>
                    <input
                        type="radio"
                        name="listingType"
                        value={opt.value}
                        checked={local.listingType === opt.value}
                        onchange={() => {
                            local.listingType = opt.value;
                            handleChange();
                        }}
                    />
                    <span>{opt.label}</span>
                </label>
            {/each}
        </div>
    </fieldset>

    <!-- Price range -->
    <fieldset class="filter-group">
        <legend class="filter-label">Price range</legend>
        <div class="filter-row">
            <div class="filter-field">
                <label for="priceMin" class="sr-only">Minimum price</label>
                <input
                    id="priceMin"
                    type="number"
                    placeholder="Min"
                    bind:value={local.priceMin}
                    onchange={handleChange}
                    min="0"
                    class="filter-input"
                />
            </div>
            <span class="filter-separator" aria-hidden="true">–</span>
            <div class="filter-field">
                <label for="priceMax" class="sr-only">Maximum price</label>
                <input
                    id="priceMax"
                    type="number"
                    placeholder="Max"
                    bind:value={local.priceMax}
                    onchange={handleChange}
                    min="0"
                    class="filter-input"
                />
            </div>
        </div>
    </fieldset>

    <!-- Bedrooms / Bathrooms / Cars -->
    <fieldset class="filter-group">
        <legend class="filter-label">Rooms & parking</legend>
        <div class="filter-grid">
            <div class="filter-field">
                <label for="bedsMin" class="filter-sublabel">Beds</label>
                <select id="bedsMin" bind:value={local.bedsMin} onchange={handleChange} class="filter-select">
                    {#each countOptions as opt (opt.value)}
                        <option value={opt.value}>{opt.label}</option>
                    {/each}
                </select>
            </div>
            <div class="filter-field">
                <label for="bathsMin" class="filter-sublabel">Baths</label>
                <select id="bathsMin" bind:value={local.bathsMin} onchange={handleChange} class="filter-select">
                    {#each countOptions as opt (opt.value)}
                        <option value={opt.value}>{opt.label}</option>
                    {/each}
                </select>
            </div>
            <div class="filter-field">
                <label for="carsMin" class="filter-sublabel">Cars</label>
                <select id="carsMin" bind:value={local.carsMin} onchange={handleChange} class="filter-select">
                    {#each countOptions as opt (opt.value)}
                        <option value={opt.value}>{opt.label}</option>
                    {/each}
                </select>
            </div>
        </div>
    </fieldset>

    <!-- Sort -->
    <fieldset class="filter-group">
        <legend class="filter-label">Sort by</legend>
        <div class="filter-row">
            <select bind:value={local.sort} onchange={handleChange} class="filter-select" aria-label="Sort field">
                {#each sortOptions as opt (opt.value)}
                    <option value={opt.value}>{opt.label}</option>
                {/each}
            </select>
            <select bind:value={local.order} onchange={handleChange} class="filter-select" aria-label="Sort direction">
                <option value="desc">High–Low</option>
                <option value="asc">Low–High</option>
            </select>
        </div>
    </fieldset>
</aside>

<style>
    .search-filters {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
        background: var(--color-bg);
        border: 1px solid var(--color-border-light);
        border-radius: var(--radius-lg);
    }

    .filters-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .filters-header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    .filters-title {
        font-size: 1rem;
        font-weight: 600;
    }

    .close-btn {
        display: none;
    }

    /* Filter groups */
    .filter-group {
        border: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .filter-label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .filter-sublabel {
        font-size: 0.75rem;
        color: var(--color-text-tertiary);
        margin-bottom: var(--space-1);
    }

    /* Select and input */
    .filter-select,
    .filter-input {
        width: 100%;
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        color: var(--color-text);
        background: var(--color-bg);
        outline: none;
        transition: border-color var(--transition-base);
    }

    .filter-select:focus,
    .filter-input:focus {
        border-color: var(--color-primary);
    }

    /* Remove number input spinners */
    .filter-input[type="number"]::-webkit-inner-spin-button,
    .filter-input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .filter-input[type="number"] {
        -moz-appearance: textfield;
        appearance: textfield;
    }

    /* Rows / grids */
    .filter-row {
        display: flex;
        gap: var(--space-2);
        align-items: center;
    }

    .filter-separator {
        color: var(--color-text-tertiary);
        flex-shrink: 0;
    }

    .filter-field {
        flex: 1;
    }

    .filter-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-2);
    }

    /* Listing type tabs */
    .filter-tabs {
        display: flex;
        gap: var(--space-1);
        flex-wrap: wrap;
    }

    .filter-tab {
        cursor: pointer;
    }

    .filter-tab input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .filter-tab span {
        display: inline-block;
        padding: var(--space-1) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
        font-size: 0.8125rem;
        font-weight: 500;
        transition:
            background var(--transition-base),
            color var(--transition-base),
            border-color var(--transition-base);
    }

    .filter-tab.active span {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
    }

    .filter-tab:hover span {
        border-color: var(--color-primary);
    }

    /* Mobile: slide-up panel */
    @media (max-width: 768px) {
        .search-filters {
            display: none;
        }

        .search-filters.mobile-open {
            display: flex;
            position: fixed;
            inset: 0;
            z-index: var(--z-modal);
            border-radius: 0;
            overflow-y: auto;
            animation: slideUp 0.2s ease;
        }

        .close-btn {
            display: flex;
        }
    }

    @keyframes slideUp {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
</style>
