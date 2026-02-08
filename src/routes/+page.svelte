<script lang="ts">
    import { goto } from "$app/navigation";
    import type { SuburbResult } from "$types/api";
    import SuburbAutocomplete from "$lib/components/search/SuburbAutocomplete.svelte";

    /** Track the user's free-text query */
    let searchText = $state("");

    /** Track the selected listing type tab */
    let listingType = $state("sale");

    /**
     * Handle suburb selection from autocomplete — navigate directly.
     */
    function handleSuburbSelect(suburb: SuburbResult): void {
        goto(
            `/search?suburb=${encodeURIComponent(suburb.suburb)}&postcode=${suburb.postcode}&state=${encodeURIComponent(suburb.state)}&listingType=${listingType}`,
        );
    }

    /**
     * Handle form submission with free text.
     */
    function handleSearchSubmit(e: SubmitEvent): void {
        e.preventDefault();
        if (!searchText.trim()) return;
        goto(`/search?q=${encodeURIComponent(searchText.trim())}&listingType=${listingType}`);
    }
</script>

<svelte:head>
    <title>LOCATION — Find your next property in Australia</title>
    <meta
        name="description"
        content="Search properties for sale and rent across Australia. Houses, apartments, land, rural, and commercial real estate."
    />
</svelte:head>

<section class="hero" aria-labelledby="hero-heading">
    <div class="container hero-inner">
        <h1 id="hero-heading">Find your next home</h1>
        <p class="hero-subtitle">Search thousands of properties for sale and rent across Australia</p>

        <form class="hero-search" onsubmit={handleSearchSubmit} role="search" aria-label="Property search">
            <div class="search-input-group">
                <SuburbAutocomplete
                    value=""
                    onSelect={handleSuburbSelect}
                    onInput={(v) => {
                        searchText = v;
                    }}
                    name="q"
                    id="search-input"
                    placeholder="Search suburb, postcode, or address..."
                    className="hero-autocomplete"
                />
                <button type="submit" class="search-btn"> Search </button>
            </div>

            <div class="search-tabs" role="radiogroup" aria-label="Listing type">
                <label class="search-tab">
                    <input
                        type="radio"
                        name="listingType"
                        value="sale"
                        checked={listingType === "sale"}
                        onchange={() => {
                            listingType = "sale";
                        }}
                    />
                    <span>Buy</span>
                </label>
                <label class="search-tab">
                    <input
                        type="radio"
                        name="listingType"
                        value="rent"
                        checked={listingType === "rent"}
                        onchange={() => {
                            listingType = "rent";
                        }}
                    />
                    <span>Rent</span>
                </label>
            </div>
        </form>
    </div>
</section>

<section class="featured" aria-labelledby="featured-heading">
    <div class="container">
        <h2 id="featured-heading">Featured listings</h2>
        <p class="section-subtitle">Coming soon — browse the latest properties on LOCATION.</p>
        <!-- TODO: Phase 4 — ListingGrid with featured listings -->
    </div>
</section>

<style>
    .hero {
        padding: var(--space-16) 0;
        text-align: center;
        background: var(--color-bg-secondary);
    }

    .hero-inner {
        max-width: 640px;
        margin-inline: auto;
    }

    .hero h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: var(--space-2);
    }

    .hero-subtitle {
        color: var(--color-text-secondary);
        font-size: 1.125rem;
        margin-bottom: var(--space-8);
    }

    .hero-search {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }

    .search-input-group {
        display: flex;
        align-items: stretch;
        border-radius: var(--radius-lg);
        overflow: visible;
        box-shadow: var(--shadow-md);
        position: relative;
    }

    :global(.hero-autocomplete) {
        flex: 1;
    }

    :global(.hero-autocomplete input) {
        height: 100%;
        box-sizing: border-box;
        border-right: none;
        border-radius: var(--radius-lg) 0 0 var(--radius-lg);
        font-size: 1rem;
        padding: var(--space-3) var(--space-4);
    }

    :global(.hero-autocomplete .suggestions) {
        border-radius: var(--radius-md);
    }

    .search-btn {
        padding: var(--space-3) var(--space-8);
        background: var(--color-primary);
        color: white;
        font-weight: 600;
        font-size: 1rem;
        border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
        border: 1px solid var(--color-primary);
        transition: background 0.15s;
        flex-shrink: 0;
    }

    .search-btn:hover {
        background: var(--color-primary-dark);
    }

    .search-tabs {
        display: flex;
        justify-content: center;
        gap: var(--space-4);
    }

    .search-tab {
        cursor: pointer;
    }

    .search-tab input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .search-tab span {
        display: inline-block;
        padding: var(--space-2) var(--space-6);
        border-radius: var(--radius-md);
        font-weight: 500;
        font-size: 0.9375rem;
        border: 1px solid var(--color-border);
        transition: all 0.15s;
    }

    .search-tab input:checked + span {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
    }

    .search-tab:hover span {
        border-color: var(--color-primary);
    }

    .featured {
        padding: var(--space-12) 0;
    }

    .featured h2 {
        margin-bottom: var(--space-2);
    }

    .section-subtitle {
        color: var(--color-text-secondary);
        margin-bottom: var(--space-8);
    }

    @media (max-width: 640px) {
        .hero h1 {
            font-size: 1.75rem;
        }

        .hero-subtitle {
            font-size: 1rem;
        }
    }
</style>
