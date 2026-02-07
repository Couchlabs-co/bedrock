<script lang="ts">
    // Homepage — hero search + featured listings
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

        <form class="hero-search" action="/search" method="get" role="search" aria-label="Property search">
            <div class="search-input-group">
                <label for="search-input" class="sr-only">Search by suburb, postcode, or address</label>
                <input
                    id="search-input"
                    type="text"
                    name="q"
                    placeholder="Search suburb, postcode, or address..."
                    autocomplete="off"
                />
                <button type="submit" class="search-btn"> Search </button>
            </div>

            <div class="search-tabs" role="tablist" aria-label="Listing type">
                <label class="search-tab">
                    <input type="radio" name="listingType" value="sale" checked />
                    <span>Buy</span>
                </label>
                <label class="search-tab">
                    <input type="radio" name="listingType" value="rent" />
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
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-md);
    }

    .search-input-group input {
        flex: 1;
        padding: var(--space-4);
        border: 1px solid var(--color-border);
        border-right: none;
        border-radius: var(--radius-lg) 0 0 var(--radius-lg);
        font-size: 1rem;
        outline: none;
    }

    .search-input-group input:focus {
        border-color: var(--color-primary);
    }

    .search-btn {
        padding: var(--space-4) var(--space-8);
        background: var(--color-primary);
        color: white;
        font-weight: 600;
        font-size: 1rem;
        border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
        border: 1px solid var(--color-primary);
        transition: background 0.15s;
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
