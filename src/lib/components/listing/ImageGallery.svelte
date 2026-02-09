<!--
    ImageGallery — Image carousel with lightbox overlay.
    Features: thumbnail strip, keyboard navigation, swipe on mobile,
    lazy loading with adjacent preload, fullscreen lightbox.
-->
<script lang="ts">
    import type { ListingImage } from "$types/api";

    interface Props {
        /** Array of listing images */
        images: ListingImage[];
        /** Alt text base (property headline) */
        altText?: string;
    }

    let { images, altText = "Property" }: Props = $props();

    /** Current active image index */
    let currentIndex = $state(0);

    /** Current image (type-safe accessor) */
    let currentImage = $derived(images[currentIndex] as ListingImage | undefined);

    /** Whether lightbox is open */
    let lightboxOpen = $state(false);

    /** Touch tracking for swipe */
    let touchStartX = $state(0);
    let touchDeltaX = $state(0);
    let isSwiping = $state(false);

    /** Get the best quality URL for main display */
    function mainUrl(img: ListingImage): string {
        return img.urlLarge ?? img.url;
    }

    /** Get thumbnail URL */
    function thumbUrl(img: ListingImage): string {
        return img.urlThumb ?? img.url;
    }

    /** Navigate to specific image */
    function goTo(index: number): void {
        currentIndex = Math.max(0, Math.min(index, images.length - 1));
    }

    /** Navigate to next image */
    function next(): void {
        if (currentIndex < images.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0;
        }
    }

    /** Navigate to previous image */
    function prev(): void {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = images.length - 1;
        }
    }

    /** Open lightbox at current index */
    function openLightbox(): void {
        lightboxOpen = true;
        document.body.style.overflow = "hidden";
    }

    /** Close lightbox */
    function closeLightbox(): void {
        lightboxOpen = false;
        document.body.style.overflow = "";
    }

    /** Handle keyboard navigation */
    function handleKeydown(e: KeyboardEvent): void {
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            prev();
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            next();
        } else if (e.key === "Escape" && lightboxOpen) {
            e.preventDefault();
            closeLightbox();
        }
    }

    /** Touch start */
    function handleTouchStart(e: TouchEvent): void {
        const touch = e.touches[0];
        if (!touch) return;
        touchStartX = touch.clientX;
        touchDeltaX = 0;
        isSwiping = true;
    }

    /** Touch move */
    function handleTouchMove(e: TouchEvent): void {
        if (!isSwiping) return;
        const touch = e.touches[0];
        if (!touch) return;
        touchDeltaX = touch.clientX - touchStartX;
    }

    /** Touch end — determine swipe direction */
    function handleTouchEnd(): void {
        if (!isSwiping) return;
        isSwiping = false;

        const SWIPE_THRESHOLD = 50;
        if (touchDeltaX > SWIPE_THRESHOLD) {
            prev();
        } else if (touchDeltaX < -SWIPE_THRESHOLD) {
            next();
        }
        touchDeltaX = 0;
    }

    /** Preload adjacent images */
    function preloadImage(url: string): void {
        const img = new Image();
        img.src = url;
    }

    $effect(() => {
        // Preload next and previous images
        if (images.length > 1) {
            const nextIdx = (currentIndex + 1) % images.length;
            const prevIdx = (currentIndex - 1 + images.length) % images.length;
            const nextImg = images[nextIdx];
            const prevImg = images[prevIdx];
            if (nextImg) preloadImage(mainUrl(nextImg));
            if (prevImg) preloadImage(mainUrl(prevImg));
        }
    });

    /** Placeholder for empty gallery */
    const PLACEHOLDER =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect fill='%23f1f3f4' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2380868b' font-family='sans-serif' font-size='24'%3ENo photos available%3C/text%3E%3C/svg%3E";
</script>

<svelte:window onkeydown={lightboxOpen ? handleKeydown : undefined} />

{#if images.length === 0}
    <!-- Empty state -->
    <div class="gallery-empty">
        <img src={PLACEHOLDER} alt="No photos available" />
    </div>
{:else}
    <!-- Main gallery -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="gallery"
        role="region"
        aria-label="Property image gallery"
        aria-roledescription="carousel"
        onkeydown={handleKeydown}
        ontouchstart={handleTouchStart}
        ontouchmove={handleTouchMove}
        ontouchend={handleTouchEnd}
    >
        <!-- Main image -->
        <div class="gallery-main">
            <button class="gallery-main-btn" onclick={openLightbox} aria-label="View full size image">
                {#if currentImage}
                    <img
                        src={mainUrl(currentImage)}
                        alt="{altText} — Photo {currentIndex + 1} of {images.length}"
                        loading={currentIndex === 0 ? "eager" : "lazy"}
                        decoding="async"
                    />
                {/if}
            </button>

            <!-- Navigation arrows -->
            {#if images.length > 1}
                <button class="gallery-nav gallery-nav-prev" onclick={prev} aria-label="Previous image">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <button class="gallery-nav gallery-nav-next" onclick={next} aria-label="Next image">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            {/if}

            <!-- Counter badge -->
            <div class="gallery-counter" aria-live="polite">
                {currentIndex + 1} / {images.length}
            </div>
        </div>

        <!-- Thumbnail strip -->
        {#if images.length > 1}
            <div class="gallery-thumbs" role="tablist" aria-label="Image thumbnails">
                {#each images as img, i (img.id)}
                    <button
                        class="thumb"
                        class:active={i === currentIndex}
                        onclick={() => goTo(i)}
                        role="tab"
                        aria-selected={i === currentIndex}
                        aria-label="View photo {i + 1}"
                    >
                        <img src={thumbUrl(img)} alt="" loading="lazy" decoding="async" />
                    </button>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Lightbox overlay -->
    {#if lightboxOpen}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="lightbox"
            role="dialog"
            aria-label="Image viewer"
            aria-modal="true"
            tabindex="-1"
            onkeydown={handleKeydown}
            ontouchstart={handleTouchStart}
            ontouchmove={handleTouchMove}
            ontouchend={handleTouchEnd}
        >
            <!-- Backdrop -->
            <button class="lightbox-backdrop" onclick={closeLightbox} aria-label="Close viewer"> </button>

            <!-- Close button -->
            <button class="lightbox-close" onclick={closeLightbox} aria-label="Close">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            <!-- Lightbox image -->
            <div class="lightbox-content">
                {#if currentImage}
                    <img src={mainUrl(currentImage)} alt="{altText} — Photo {currentIndex + 1} of {images.length}" />
                {/if}
            </div>

            <!-- Lightbox navigation -->
            {#if images.length > 1}
                <button class="lightbox-nav lightbox-nav-prev" onclick={prev} aria-label="Previous image">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <button class="lightbox-nav lightbox-nav-next" onclick={next} aria-label="Next image">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            {/if}

            <!-- Lightbox counter -->
            <div class="lightbox-counter" aria-live="polite">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    {/if}
{/if}

<style>
    /* ========== Gallery ========== */
    .gallery-empty {
        border-radius: var(--radius-lg);
        overflow: hidden;
        background: var(--color-bg-tertiary);
    }

    .gallery {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    /* Main image */
    .gallery-main {
        position: relative;
        border-radius: var(--radius-lg);
        overflow: hidden;
        background: var(--color-bg-tertiary);
    }

    .gallery-main-btn {
        display: block;
        width: 100%;
        padding: 0;
        cursor: zoom-in;
    }

    .gallery-main-btn img {
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
    }

    /* Nav arrows */
    .gallery-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        background: rgba(0, 0, 0, 0.5);
        color: white;
        opacity: 0;
        transition: opacity var(--transition-base);
    }

    .gallery:hover .gallery-nav,
    .gallery-nav:focus-visible {
        opacity: 1;
    }

    .gallery-nav-prev {
        left: var(--space-3);
    }

    .gallery-nav-next {
        right: var(--space-3);
    }

    .gallery-nav:hover {
        background: rgba(0, 0, 0, 0.7);
    }

    /* Counter */
    .gallery-counter {
        position: absolute;
        bottom: var(--space-3);
        right: var(--space-3);
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-full);
        background: rgba(0, 0, 0, 0.6);
        color: white;
        font-size: 0.8125rem;
        font-weight: 500;
    }

    /* Thumbnails */
    .gallery-thumbs {
        display: flex;
        gap: var(--space-2);
        overflow-x: auto;
        padding: var(--space-1) 0;
        scrollbar-width: thin;
    }

    .thumb {
        flex-shrink: 0;
        width: 72px;
        height: 54px;
        border-radius: var(--radius-sm);
        overflow: hidden;
        border: 2px solid transparent;
        opacity: 0.6;
        transition:
            opacity var(--transition-base),
            border-color var(--transition-base);
        padding: 0;
        cursor: pointer;
    }

    .thumb:hover {
        opacity: 0.9;
    }

    .thumb.active {
        border-color: var(--color-primary);
        opacity: 1;
    }

    .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    /* ========== Lightbox ========== */
    .lightbox {
        position: fixed;
        inset: 0;
        z-index: var(--z-modal);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .lightbox-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.92);
        border: none;
        cursor: default;
        width: 100%;
        height: 100%;
    }

    .lightbox-close {
        position: absolute;
        top: var(--space-4);
        right: var(--space-4);
        z-index: 1;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        transition: background var(--transition-base);
    }

    .lightbox-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .lightbox-content {
        position: relative;
        z-index: 1;
        max-width: 90vw;
        max-height: 85vh;
        pointer-events: none;
    }

    .lightbox-content img {
        max-width: 90vw;
        max-height: 85vh;
        object-fit: contain;
        border-radius: var(--radius-md);
    }

    /* Lightbox nav */
    .lightbox-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        transition: background var(--transition-base);
    }

    .lightbox-nav:hover {
        background: rgba(255, 255, 255, 0.25);
    }

    .lightbox-nav-prev {
        left: var(--space-4);
    }

    .lightbox-nav-next {
        right: var(--space-4);
    }

    .lightbox-counter {
        position: absolute;
        bottom: var(--space-6);
        left: 50%;
        transform: translateX(-50%);
        z-index: 1;
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-full);
        background: rgba(0, 0, 0, 0.6);
        color: white;
        font-size: 0.875rem;
        font-weight: 500;
    }

    /* Mobile — always show nav arrows */
    @media (max-width: 768px) {
        .gallery-nav {
            opacity: 1;
            width: 36px;
            height: 36px;
        }

        .gallery-thumbs {
            display: none;
        }

        .lightbox-nav {
            width: 40px;
            height: 40px;
        }
    }
</style>
