<!--
    Listing Detail Page — Full property detail view.
    Displays image gallery, price, address, property details grid,
    description, features checklist, inspection times, agent cards,
    and public inquiry form.
-->
<script lang="ts">
    import ImageGallery from "$components/listing/ImageGallery.svelte";
    import InquiryForm from "$components/listing/InquiryForm.svelte";
    import AgentCard from "$components/listing/AgentCard.svelte";
    import { formatPrice, formatRent, formatDate, formatArea } from "$lib/utils/format";
    import type { ListingDetail, AllFeatures } from "$types/api";

    let { data } = $props();

    const listing: ListingDetail = $derived(data.listing);

    /* ──────── Price display ──────── */
    let displayPrice = $derived.by(() => {
        // Respect priceDisplay flag
        if (listing.priceDisplay === false) {
            return listing.priceView || "Contact Agent";
        }

        // Rental
        if (listing.listingType === "rent" && listing.rentAmount) {
            return formatRent(Number(listing.rentAmount), listing.rentPeriod);
        }

        // Sale
        if (listing.price) {
            return formatPrice(Number(listing.price));
        }

        return listing.priceView || "Contact Agent";
    });

    /* ──────── Car spaces ──────── */
    let totalCarSpaces = $derived(
        (listing.allFeatures?.garages ?? listing.features?.garages ?? 0) +
            (listing.allFeatures?.carports ?? listing.features?.carports ?? 0) +
            (listing.allFeatures?.openSpaces ?? 0),
    );

    /* ──────── Property type label ──────── */
    let propertyTypeLabel = $derived.by(() => {
        const map: Record<string, string> = {
            residential: "Residential",
            rental: "Rental",
            commercial: "Commercial",
            land: "Land",
            rural: "Rural",
            holidayRental: "Holiday Rental",
        };
        return map[listing.propertyType] ?? listing.propertyType;
    });

    /* ──────── Listing type label ──────── */
    let listingTypeLabel = $derived.by(() => {
        const map: Record<string, string> = {
            sale: "For Sale",
            rent: "For Rent",
            lease: "For Lease",
            both: "Sale or Lease",
        };
        return map[listing.listingType] ?? listing.listingType;
    });

    /* ──────── Features grouped ──────── */
    interface FeatureGroup {
        label: string;
        items: { label: string; value: boolean }[];
    }

    let featureGroups = $derived.by((): FeatureGroup[] => {
        const f = listing.allFeatures;
        if (!f) return [];

        const groups: FeatureGroup[] = [];

        // Indoor
        const indoor = [
            { label: "Air Conditioning", value: f.airConditioning },
            { label: "Alarm System", value: f.alarmSystem },
            { label: "Intercom", value: f.intercom },
            { label: "Open Fireplace", value: f.openFireplace },
            { label: "Remote Garage", value: f.remoteGarage },
            { label: "Vacuum System", value: f.vacuumSystem },
            { label: "Furnished", value: f.furnished },
        ].filter((item): item is { label: string; value: boolean } => item.value === true);

        if (indoor.length > 0) {
            groups.push({ label: "Indoor", items: indoor });
        }

        // Outdoor
        const outdoor = [
            { label: "Balcony", value: f.balcony },
            { label: "Courtyard", value: f.courtyard },
            { label: "Deck", value: f.deck },
            { label: "Fully Fenced", value: f.fullyFenced },
            { label: "Outdoor Entertainment", value: f.outdoorEnt },
            { label: "Shed", value: f.shed },
            { label: "Tennis Court", value: f.tennisCourt },
        ].filter((item): item is { label: string; value: boolean } => item.value === true);

        if (outdoor.length > 0) {
            groups.push({ label: "Outdoor", items: outdoor });
        }

        // Climate & Energy
        const climate = [
            { label: "In-ground Pool", value: f.poolInground },
            { label: "Above-ground Pool", value: f.poolAbove },
            { label: "Spa", value: f.spa },
        ].filter((item): item is { label: string; value: boolean } => item.value === true);

        if (f.heatingType) {
            climate.push({ label: `Heating: ${f.heatingType}`, value: true });
        }
        if (f.hotWaterType) {
            climate.push({ label: `Hot Water: ${f.hotWaterType}`, value: true });
        }

        if (climate.length > 0) {
            groups.push({ label: "Climate & Energy", items: climate });
        }

        // Parking & Security
        const parking = [{ label: "Secure Parking", value: f.secureParking }].filter(
            (item): item is { label: string; value: boolean } => item.value === true,
        );

        if (parking.length > 0) {
            groups.push({ label: "Parking & Security", items: parking });
        }

        // Lifestyle
        const lifestyle = [
            { label: "Pet Friendly", value: f.petFriendly },
            { label: "Smokers Allowed", value: f.smokersAllowed },
        ].filter((item): item is { label: string; value: boolean } => item.value === true);

        if (lifestyle.length > 0) {
            groups.push({ label: "Lifestyle", items: lifestyle });
        }

        return groups;
    });

    /* ──────── Room counts ──────── */
    interface RoomCount {
        label: string;
        value: number;
    }

    let roomCounts = $derived.by((): RoomCount[] => {
        const f = listing.allFeatures;
        if (!f) return [];

        const counts: RoomCount[] = [];
        if (f.ensuites != null && f.ensuites > 0) counts.push({ label: "Ensuites", value: f.ensuites });
        if (f.toilets != null && f.toilets > 0) counts.push({ label: "Toilets", value: f.toilets });
        if (f.livingAreas != null && f.livingAreas > 0) counts.push({ label: "Living Areas", value: f.livingAreas });
        if (f.garages != null && f.garages > 0) counts.push({ label: "Garages", value: f.garages });
        if (f.carports != null && f.carports > 0) counts.push({ label: "Carports", value: f.carports });
        if (f.openSpaces != null && f.openSpaces > 0) counts.push({ label: "Open Spaces", value: f.openSpaces });
        return counts;
    });

    /* ──────── Upcoming inspections ──────── */
    let upcomingInspections = $derived(
        listing.inspections.filter((insp) => {
            if (!insp.startsAt) return true; // No date — include
            return new Date(insp.startsAt) >= new Date();
        }),
    );

    /* ──────── Agent names for inquiry form ──────── */
    let agentNames = $derived(listing.agents.map((a) => a.name));

    /* ──────── Breadcrumb address parts ──────── */
    let breadcrumbParts = $derived.by(() => {
        const parts: { label: string; href?: string }[] = [{ label: "Home", href: "/" }];

        if (listing.address?.state) {
            parts.push({
                label: listing.address.state,
                href: `/search?state=${encodeURIComponent(listing.address.state)}`,
            });
        }

        if (listing.address?.suburb) {
            parts.push({
                label: listing.address.suburb,
                href: `/search?suburb=${encodeURIComponent(listing.address.suburb)}`,
            });
        }

        parts.push({ label: listing.headline ?? "Listing" });

        return parts;
    });

    /**
     * Format inspection time range.
     */
    function formatInspectionTime(startsAt: Date | null, endsAt: Date | null): string {
        if (!startsAt) return "Time TBA";

        const start = new Date(startsAt);
        const day = start.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
        const startTime = start.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

        if (!endsAt) return `${day} at ${startTime}`;

        const end = new Date(endsAt);
        const endTime = end.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

        return `${day}, ${startTime} – ${endTime}`;
    }
</script>

<svelte:head>
    <title>{data.meta.title}</title>
    <meta name="description" content={data.meta.description} />
    {#if data.meta.ogImage}
        <meta property="og:image" content={data.meta.ogImage} />
    {/if}
</svelte:head>

<main class="listing-detail">
    <!-- Breadcrumb -->
    <nav class="breadcrumb container" aria-label="Breadcrumb">
        <ol>
            {#each breadcrumbParts as part, i (i)}
                <li>
                    {#if part.href && i < breadcrumbParts.length - 1}
                        <a href={part.href}>{part.label}</a>
                    {:else}
                        <span aria-current="page">{part.label}</span>
                    {/if}
                </li>
            {/each}
        </ol>
    </nav>

    <div class="container detail-layout">
        <!-- Left column: main content -->
        <div class="detail-main">
            <!-- Image Gallery -->
            <ImageGallery images={listing.images} altText={listing.headline ?? "Property"} />

            <!-- Price & badge header -->
            <header class="listing-header">
                <div class="header-top">
                    <h1 class="listing-price">{displayPrice}</h1>
                    <div class="listing-badges">
                        <span class="badge badge-type">{listingTypeLabel}</span>
                        <span class="badge badge-prop">{propertyTypeLabel}</span>
                        {#if listing.underOffer}
                            <span class="badge badge-offer">Under Offer</span>
                        {/if}
                        {#if listing.isNewConstruction}
                            <span class="badge badge-new">New Construction</span>
                        {/if}
                    </div>
                </div>

                {#if listing.headline}
                    <h2 class="listing-headline">{listing.headline}</h2>
                {/if}

                <!-- Address -->
                {#if listing.address}
                    <p class="listing-address">
                        {listing.address.formatted ?? listing.address.suburb}
                        {#if listing.address.state}
                            {listing.address.state}
                        {/if}
                        {#if listing.address.postcode}
                            {listing.address.postcode}
                        {/if}
                    </p>
                {/if}
            </header>

            <!-- Property details grid -->
            <section class="details-grid" aria-label="Property details">
                {#if listing.allFeatures?.bedrooms != null || listing.features?.bedrooms != null}
                    <div class="detail-item">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        >
                            <path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" /><path
                                d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"
                            /><path d="M3 12h18" />
                        </svg>
                        <span class="detail-value">{listing.allFeatures?.bedrooms ?? listing.features?.bedrooms}</span>
                        <span class="detail-label">Beds</span>
                    </div>
                {/if}

                {#if listing.allFeatures?.bathrooms != null || listing.features?.bathrooms != null}
                    <div class="detail-item">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        >
                            <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z" /><path
                                d="M6 12V5a2 2 0 0 1 2-2h3v2.25"
                            />
                        </svg>
                        <span class="detail-value">{listing.allFeatures?.bathrooms ?? listing.features?.bathrooms}</span
                        >
                        <span class="detail-label">Baths</span>
                    </div>
                {/if}

                {#if totalCarSpaces > 0}
                    <div class="detail-item">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        >
                            <path d="M5 17h14v-5l-2-6H7L5 12v5z" /><circle cx="7.5" cy="17" r="1.5" /><circle
                                cx="16.5"
                                cy="17"
                                r="1.5"
                            />
                        </svg>
                        <span class="detail-value">{totalCarSpaces}</span>
                        <span class="detail-label">Cars</span>
                    </div>
                {/if}

                {#if listing.landArea}
                    <div class="detail-item">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                        <span class="detail-value">{formatArea(Number(listing.landArea), listing.landAreaUnit)}</span>
                        <span class="detail-label">Land</span>
                    </div>
                {/if}

                {#if listing.buildingArea}
                    <div class="detail-item">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        >
                            <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><path
                                d="M9 9h1"
                            /><path d="M9 13h1" /><path d="M9 17h1" />
                        </svg>
                        <span class="detail-value"
                            >{formatArea(Number(listing.buildingArea), listing.buildingAreaUnit)}</span
                        >
                        <span class="detail-label">Building</span>
                    </div>
                {/if}

                {#if listing.yearBuilt}
                    <div class="detail-item">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line
                                x1="16"
                                y1="2"
                                x2="16"
                                y2="6"
                            /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span class="detail-value">{listing.yearBuilt}</span>
                        <span class="detail-label">Year Built</span>
                    </div>
                {/if}
            </section>

            <!-- Additional room counts -->
            {#if roomCounts.length > 0}
                <section class="room-counts" aria-label="Room counts">
                    {#each roomCounts as room (room.label)}
                        <div class="room-item">
                            <span class="room-value">{room.value}</span>
                            <span class="room-label">{room.label}</span>
                        </div>
                    {/each}
                </section>
            {/if}

            <!-- Description -->
            {#if listing.description}
                <section class="description" aria-labelledby="desc-heading">
                    <h3 id="desc-heading">Description</h3>
                    <div class="description-text">
                        {#each listing.description.split("\n") as para (para)}
                            {#if para.trim()}
                                <p>{para}</p>
                            {/if}
                        {/each}
                    </div>
                </section>
            {/if}

            <!-- Features checklist -->
            {#if featureGroups.length > 0}
                <section class="features-section" aria-labelledby="features-heading">
                    <h3 id="features-heading">Features</h3>
                    <div class="feature-groups">
                        {#each featureGroups as group (group.label)}
                            <div class="feature-group">
                                <h4>{group.label}</h4>
                                <ul>
                                    {#each group.items as feat (feat.label)}
                                        <li>
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="var(--color-secondary)"
                                                stroke-width="2.5"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            {feat.label}
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        {/each}
                    </div>

                    <!-- Other features (free text) -->
                    {#if listing.allFeatures?.otherFeatures}
                        <div class="other-features">
                            <h4>Other</h4>
                            <p>{listing.allFeatures.otherFeatures}</p>
                        </div>
                    {/if}
                </section>
            {/if}

            <!-- Rental-specific info -->
            {#if listing.listingType === "rent"}
                <section class="rental-info" aria-labelledby="rental-heading">
                    <h3 id="rental-heading">Rental Details</h3>
                    <dl class="info-list">
                        {#if listing.bond}
                            <div class="info-row">
                                <dt>Bond</dt>
                                <dd>{formatPrice(Number(listing.bond))}</dd>
                            </div>
                        {/if}
                        {#if listing.dateAvailable}
                            <div class="info-row">
                                <dt>Available From</dt>
                                <dd>{formatDate(listing.dateAvailable)}</dd>
                            </div>
                        {/if}
                    </dl>
                </section>
            {/if}

            <!-- Auction info -->
            {#if listing.auctionDate}
                <section class="auction-info" aria-label="Auction information">
                    <div class="auction-badge">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        >
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        <div>
                            <span class="auction-label">Auction</span>
                            <span class="auction-date">{formatDate(listing.auctionDate)}</span>
                        </div>
                    </div>
                </section>
            {/if}

            <!-- Inspection times -->
            {#if upcomingInspections.length > 0}
                <section class="inspections" aria-labelledby="inspect-heading">
                    <h3 id="inspect-heading">Inspection Times</h3>
                    <ul class="inspection-list">
                        {#each upcomingInspections as insp (insp.id)}
                            <li class="inspection-item">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                >
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line
                                        x1="16"
                                        y1="2"
                                        x2="16"
                                        y2="6"
                                    /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <div>
                                    <span class="inspection-time">
                                        {formatInspectionTime(insp.startsAt, insp.endsAt)}
                                    </span>
                                    {#if insp.description}
                                        <span class="inspection-desc">{insp.description}</span>
                                    {/if}
                                </div>
                            </li>
                        {/each}
                    </ul>
                </section>
            {/if}

            <!-- Sold info -->
            {#if listing.status === "sold" && listing.soldDate}
                <section class="sold-info" aria-label="Sold information">
                    <div class="sold-banner">
                        <span class="sold-label">SOLD</span>
                        <span class="sold-date">{formatDate(listing.soldDate)}</span>
                        {#if listing.soldPrice && listing.soldPriceDisplay !== "no"}
                            <span class="sold-price">{formatPrice(Number(listing.soldPrice))}</span>
                        {/if}
                    </div>
                </section>
            {/if}
        </div>

        <!-- Right column: sidebar -->
        <aside class="detail-sidebar">
            <!-- Agent cards -->
            {#if listing.agents.length > 0}
                <section class="sidebar-section" aria-labelledby="agents-heading">
                    <h3 id="agents-heading">Listing Agent{listing.agents.length > 1 ? "s" : ""}</h3>
                    <div class="agent-cards">
                        {#each listing.agents as agent, i (agent.name)}
                            <AgentCard {agent} agency={listing.agency} showAgency={i === 0} />
                        {/each}
                    </div>
                </section>
            {/if}

            <!-- Inquiry form -->
            <InquiryForm listingId={listing.id} {agentNames} />

            <!-- Video link -->
            {#if listing.videoLink}
                <div class="sidebar-section">
                    <a
                        href={listing.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-outline btn-lg video-link"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Watch Video Tour
                    </a>
                </div>
            {/if}

            <!-- External link -->
            {#if listing.externalLink}
                <div class="sidebar-section">
                    <a
                        href={listing.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-ghost btn-lg external-link"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline
                                points="15 3 21 3 21 9"
                            /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        View External Link
                    </a>
                </div>
            {/if}
        </aside>
    </div>
</main>

<style>
    /* ========== Layout ========== */
    .listing-detail {
        padding-bottom: var(--space-16);
    }

    .detail-layout {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: var(--space-8);
        margin-top: var(--space-4);
    }

    .detail-main {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        min-width: 0;
    }

    .detail-sidebar {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }

    .sidebar-section h3 {
        font-size: 1rem;
        margin-bottom: var(--space-3);
    }

    /* ========== Breadcrumb ========== */
    .breadcrumb {
        padding-top: var(--space-4);
    }

    .breadcrumb ol {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
        list-style: none;
        font-size: 0.8125rem;
        color: var(--color-text-tertiary);
    }

    .breadcrumb li:not(:last-child)::after {
        content: "›";
        margin-left: var(--space-1);
    }

    .breadcrumb a {
        color: var(--color-text-secondary);
    }

    .breadcrumb span[aria-current] {
        color: var(--color-text);
        font-weight: 500;
    }

    /* ========== Header ========== */
    .listing-header {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .header-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-4);
        flex-wrap: wrap;
    }

    .listing-price {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--color-text);
        line-height: 1.2;
    }

    .listing-badges {
        display: flex;
        gap: var(--space-2);
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
        background: var(--color-primary-light);
        color: var(--color-primary);
    }

    .badge-prop {
        background: var(--color-bg-tertiary);
        color: var(--color-text-secondary);
    }

    .badge-offer {
        background: var(--color-warning);
        color: #1a1a1a;
    }

    .badge-new {
        background: var(--color-secondary);
        color: white;
    }

    .listing-headline {
        font-size: 1.125rem;
        font-weight: 500;
        color: var(--color-text);
    }

    .listing-address {
        font-size: 1rem;
        color: var(--color-text-secondary);
    }

    /* ========== Details grid ========== */
    .details-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        padding: var(--space-4) var(--space-6);
        background: var(--color-bg-secondary);
        border-radius: var(--radius-lg);
    }

    .detail-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        min-width: 100px;
    }

    .detail-item svg {
        color: var(--color-text-tertiary);
        flex-shrink: 0;
    }

    .detail-value {
        font-weight: 700;
        font-size: 1.125rem;
        color: var(--color-text);
    }

    .detail-label {
        font-size: 0.8125rem;
        color: var(--color-text-secondary);
    }

    /* ========== Room counts ========== */
    .room-counts {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
    }

    .room-item {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-2) var(--space-3);
        background: var(--color-bg-secondary);
        border-radius: var(--radius-md);
        font-size: 0.8125rem;
        color: var(--color-text-secondary);
    }

    .room-value {
        font-weight: 700;
        color: var(--color-text);
    }

    /* ========== Description ========== */
    .description {
        border-top: 1px solid var(--color-border-light);
        padding-top: var(--space-6);
    }

    .description h3 {
        margin-bottom: var(--space-3);
    }

    .description-text {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        line-height: 1.7;
        color: var(--color-text-secondary);
    }

    /* ========== Features ========== */
    .features-section {
        border-top: 1px solid var(--color-border-light);
        padding-top: var(--space-6);
    }

    .features-section h3 {
        margin-bottom: var(--space-4);
    }

    .feature-groups {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: var(--space-6);
    }

    .feature-group h4 {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-text-secondary);
        margin-bottom: var(--space-2);
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .feature-group ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .feature-group li {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 0.875rem;
        color: var(--color-text);
    }

    .feature-group li svg {
        flex-shrink: 0;
    }

    .other-features {
        margin-top: var(--space-4);
        padding-top: var(--space-3);
        border-top: 1px solid var(--color-border-light);
    }

    .other-features h4 {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-text-secondary);
        margin-bottom: var(--space-2);
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .other-features p {
        font-size: 0.875rem;
        color: var(--color-text);
        line-height: 1.6;
    }

    /* ========== Rental info ========== */
    .rental-info,
    .inspections {
        border-top: 1px solid var(--color-border-light);
        padding-top: var(--space-6);
    }

    .rental-info h3,
    .inspections h3 {
        margin-bottom: var(--space-3);
    }

    .info-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        padding: var(--space-2) 0;
        border-bottom: 1px solid var(--color-border-light);
    }

    .info-row dt {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
    }

    .info-row dd {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-text);
    }

    /* ========== Auction ========== */
    .auction-badge {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        background: var(--color-primary-light);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-primary);
    }

    .auction-badge svg {
        color: var(--color-primary);
        flex-shrink: 0;
    }

    .auction-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--color-primary);
        letter-spacing: 0.04em;
    }

    .auction-date {
        display: block;
        font-weight: 700;
        color: var(--color-text);
    }

    /* ========== Inspections ========== */
    .inspection-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .inspection-item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        background: var(--color-bg-secondary);
        border-radius: var(--radius-md);
    }

    .inspection-item svg {
        color: var(--color-primary);
        flex-shrink: 0;
        margin-top: 2px;
    }

    .inspection-time {
        display: block;
        font-weight: 600;
        font-size: 0.9375rem;
        color: var(--color-text);
    }

    .inspection-desc {
        display: block;
        font-size: 0.8125rem;
        color: var(--color-text-secondary);
        margin-top: var(--space-1);
    }

    /* ========== Sold banner ========== */
    .sold-banner {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4) var(--space-6);
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: var(--radius-lg);
    }

    :root[data-theme="dark"] .sold-banner {
        background: rgba(234, 67, 53, 0.1);
        border-color: rgba(234, 67, 53, 0.3);
    }

    .sold-label {
        font-weight: 800;
        font-size: 1.125rem;
        color: var(--color-danger);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .sold-date {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
    }

    .sold-price {
        font-weight: 700;
        color: var(--color-text);
        margin-left: auto;
    }

    /* ========== Sidebar links ========== */
    .agent-cards {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .video-link,
    .external-link {
        width: 100%;
    }

    /* ========== Responsive ========== */
    @media (max-width: 1024px) {
        .detail-layout {
            grid-template-columns: 1fr;
        }

        .detail-sidebar {
            order: -1;
        }
    }

    @media (max-width: 640px) {
        .listing-price {
            font-size: 1.5rem;
        }

        .details-grid {
            padding: var(--space-3) var(--space-4);
            gap: var(--space-3);
        }

        .detail-item {
            min-width: 80px;
        }

        .header-top {
            flex-direction: column;
            gap: var(--space-2);
        }

        .sold-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-2);
        }

        .sold-price {
            margin-left: 0;
        }
    }
</style>
