<!--
    ListingCard — Summary card for a property listing.
    Shows hero image, price, address, beds/baths/cars, property type badge.
    Includes favourite heart toggle (prompts login if unauthenticated).
    Responsive: horizontal on desktop, vertical stack on mobile.
-->
<script lang="ts">
    import type { ListingSummary } from "$types/api";
    import { formatPrice, formatRent, formatArea } from "$lib/utils/format";

    interface Props {
        /** Listing summary data */
        listing: ListingSummary;
        /** Whether the listing is favourited by the current user */
        isFavourited?: boolean;
        /** Whether the user is authenticated (controls favourite behaviour) */
        isAuthenticated?: boolean;
        /** Callback when favourite is toggled — receives listing id */
        onFavouriteToggle?: (listingId: string) => void;
        /** Layout variant */
        layout?: "grid" | "list";
    }

    let {
        listing,
        isFavourited = false,
        isAuthenticated = false,
        onFavouriteToggle,
        layout = "grid",
    }: Props = $props();

    /** Computed display price */
    let displayPrice = $derived.by(() => {
        // If price display is explicitly off, show priceView or "Contact Agent"
        if (listing.priceDisplay === false) {
            return listing.priceView || "Contact Agent";
        }

        // Rental
        if (listing.listingType === "rent" && listing.rentAmount) {
            return formatRent(Number(listing.rentAmount), listing.rentPeriod);
        }

        // Sale / other
        if (listing.price) {
            return formatPrice(Number(listing.price));
        }

        // Fallback
        return listing.priceView || "Contact Agent";
    });

    /** Total car spaces */
    let carSpaces = $derived((listing.features?.garages ?? 0) + (listing.features?.carports ?? 0));

    /** Property type label */
    let propertyBadge = $derived.by(() => {
        const map: Record<string, string> = {
            residential: "House",
            rental: "Rental",
            commercial: "Commercial",
            land: "Land",
            rural: "Rural",
            holidayRental: "Holiday",
        };
        return map[listing.propertyType] ?? listing.propertyType;
    });

    /** Handle favourite click */
    function handleFavourite(e: MouseEvent): void {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            // Redirect to login with return URL
            window.location.href = `/auth/login?returnTo=${encodeURIComponent(`/listing/${listing.id}`)}`;
            return;
        }

        onFavouriteToggle?.(listing.id);
    }

    /** Placeholder image for listings without photos */
    const PLACEHOLDER_IMAGE =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f1f3f4' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2380868b' font-family='sans-serif' font-size='16'%3ENo image%3C/text%3E%3C/svg%3E";
</script>

<article class="listing-card {layout}" data-listing-id={listing.id}>
    <a href="/listing/{listing.id}" class="card-link" aria-label="{listing.headline ?? 'Property'} — {displayPrice}">
        <!-- Image -->
        <div class="card-image">
            <img
                src={listing.heroImage?.urlThumb ?? listing.heroImage?.url ?? PLACEHOLDER_IMAGE}
                alt={listing.headline ?? "Property listing"}
                loading="lazy"
                decoding="async"
            />

            <!-- Badges -->
            <div class="card-badges">
                <span class="badge badge-type">{propertyBadge}</span>
                {#if listing.underOffer}
                    <span class="badge badge-offer">Under Offer</span>
                {/if}
                {#if listing.isNewConstruction}
                    <span class="badge badge-new">New</span>
                {/if}
            </div>

            <!-- Favourite button -->
            <button
                class="fav-btn"
                class:active={isFavourited}
                onclick={handleFavourite}
                aria-label={isFavourited ? "Remove from saved properties" : "Save property"}
                title={isAuthenticated ? (isFavourited ? "Remove from saved" : "Save property") : "Sign in to save"}
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={isFavourited ? "currentColor" : "none"}
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    />
                </svg>
            </button>
        </div>

        <!-- Content -->
        <div class="card-content">
            <p class="card-price">{displayPrice}</p>

            <p class="card-address">
                {#if listing.address}
                    {listing.address.formatted ?? listing.address.suburb}
                    {#if listing.address.state}
                        <span class="card-state">{listing.address.state} {listing.address.postcode ?? ""}</span>
                    {/if}
                {:else}
                    Address not available
                {/if}
            </p>

            {#if listing.headline}
                <p class="card-headline">{listing.headline}</p>
            {/if}

            <!-- Features row -->
            <div class="card-features">
                {#if listing.features?.bedrooms != null}
                    <span class="feature" aria-label="{listing.features.bedrooms} bedrooms">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            ><path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" /><path
                                d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"
                            /><path d="M3 12h18" /></svg
                        >
                        <span>{listing.features.bedrooms}</span>
                    </span>
                {/if}
                {#if listing.features?.bathrooms != null}
                    <span class="feature" aria-label="{listing.features.bathrooms} bathrooms">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            ><path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z" /><path
                                d="M6 12V5a2 2 0 0 1 2-2h3v2.25"
                            /></svg
                        >
                        <span>{listing.features.bathrooms}</span>
                    </span>
                {/if}
                {#if carSpaces > 0}
                    <span class="feature" aria-label="{carSpaces} car spaces">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            ><path d="M5 17h14v-5l-2-6H7L5 12v5z" /><circle cx="7.5" cy="17" r="1.5" /><circle
                                cx="16.5"
                                cy="17"
                                r="1.5"
                            /></svg
                        >
                        <span>{carSpaces}</span>
                    </span>
                {/if}
                {#if listing.landArea}
                    <span
                        class="feature feature-area"
                        aria-label="Land area {formatArea(Number(listing.landArea), listing.landAreaUnit)}"
                    >
                        {formatArea(Number(listing.landArea), listing.landAreaUnit)}
                    </span>
                {/if}
            </div>
        </div>
    </a>
</article>

<style>
    .listing-card {
        background: var(--color-bg);
        border: 1px solid var(--color-border-light);
        border-radius: var(--radius-lg);
        overflow: hidden;
        transition:
            box-shadow var(--transition-base),
            transform var(--transition-base);
    }

    .listing-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
    }

    .card-link {
        display: flex;
        flex-direction: column;
        text-decoration: none;
        color: inherit;
        height: 100%;
    }

    .card-link:hover {
        text-decoration: none;
    }

    /* List layout — horizontal card */
    .listing-card.list .card-link {
        flex-direction: row;
    }

    .listing-card.list .card-image {
        width: 280px;
        min-height: 180px;
        flex-shrink: 0;
    }

    /* Image */
    .card-image {
        position: relative;
        aspect-ratio: 4 / 3;
        overflow: hidden;
        background: var(--color-bg-tertiary);
    }

    .card-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--transition-slow);
    }

    .listing-card:hover .card-image img {
        transform: scale(1.03);
    }

    /* Badges */
    .card-badges {
        position: absolute;
        top: var(--space-2);
        left: var(--space-2);
        display: flex;
        gap: var(--space-1);
        flex-wrap: wrap;
    }

    .badge {
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
    }

    .badge-type {
        background: var(--color-bg);
        color: var(--color-text);
        box-shadow: var(--shadow-sm);
    }

    .badge-offer {
        background: var(--color-warning);
        color: #1a1a1a;
    }

    .badge-new {
        background: var(--color-secondary);
        color: white;
    }

    /* Favourite */
    .fav-btn {
        position: absolute;
        top: var(--space-2);
        right: var(--space-2);
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        background: rgba(255, 255, 255, 0.9);
        color: var(--color-text-secondary);
        backdrop-filter: blur(4px);
        transition:
            color var(--transition-base),
            background var(--transition-base),
            transform var(--transition-base);
    }

    .fav-btn:hover {
        transform: scale(1.1);
        color: var(--color-danger);
        background: white;
    }

    .fav-btn.active {
        color: var(--color-danger);
    }

    /* Content */
    .card-content {
        padding: var(--space-3) var(--space-4) var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        flex: 1;
    }

    .card-price {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--color-text);
    }

    .card-address {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        line-height: 1.4;
    }

    .card-state {
        opacity: 0.8;
    }

    .card-headline {
        font-size: 0.8125rem;
        color: var(--color-text-tertiary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* Features */
    .card-features {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-top: var(--space-1);
        padding-top: var(--space-2);
        border-top: 1px solid var(--color-border-light);
        font-size: 0.8125rem;
        color: var(--color-text-secondary);
    }

    .feature {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
    }

    .feature svg {
        color: var(--color-text-tertiary);
    }

    .feature-area {
        margin-left: auto;
        font-size: 0.75rem;
    }

    /* Responsive */
    @media (max-width: 640px) {
        .listing-card.list .card-link {
            flex-direction: column;
        }

        .listing-card.list .card-image {
            width: 100%;
            min-height: auto;
        }
    }
</style>
