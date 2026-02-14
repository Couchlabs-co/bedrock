<script lang="ts">
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";
    import { setSearchState } from "$stores/search.svelte";

    let { form }: { form?: { error?: string; query?: string } } = $props();

    /** Form state */
    let listingType = $state("sale");
    let isSearching = $state(false);
</script>

<section class="hero">
    <h1>Find Your Dream Property</h1>
    <p class="hero-subtitle">Search using natural language. Try: "3 bedroom house in Mosman with pool"</p>

    <form
        class="hero-search"
        method="POST"
        action="?/search"
        use:enhance={() => {
            isSearching = true;
            return async ({ result, update }) => {
                if (result.type === 'success' && result.data?.success && result.data.data) {
                    const { criteria, listings, originalQuery, confidence, redirectUrl } = result.data.data;

                    // Store in global state for instant search page display
                    setSearchState(criteria, listings, originalQuery, confidence);

                    // Navigate to search page
                    await goto(redirectUrl);
                } else {
                    // Show error via form prop
                    await update();
                }
                isSearching = false;
            };
        }}
        role="search"
        aria-label="Property search"
    >
        <div class="search-input-group">
            <input
                type="text"
                name="query"
                value={form?.query ?? ""}
                placeholder="Describe what you're looking for..."
                class="search-input"
                aria-label="Property search query"
                disabled={isSearching}
                required
            />
            <button type="submit" class="search-btn" disabled={isSearching}>
                {#if isSearching}
                    <span class="spinner"></span>
                    <span>Searching...</span>
                {:else}
                    Search
                {/if}
            </button>
        </div>

        {#if form?.error}
            <div class="error-message" role="alert">
                {form.error}
            </div>
        {/if}

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
                    disabled={isSearching}
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
                    disabled={isSearching}
                />
                <span>Rent</span>
            </label>
        </div>
    </form>
</section>

<style>
    .hero {
        min-height: 70vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        text-align: center;
    }

    .hero h1 {
        font-size: 3rem;
        margin: 0 0 1rem;
        font-weight: 700;
    }

    .hero-subtitle {
        font-size: 1.1rem;
        opacity: 0.95;
        margin: 0 0 2rem;
        max-width: 600px;
        line-height: 1.6;
    }

    .hero-search {
        width: 100%;
        max-width: 700px;
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .search-input-group {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .search-input {
        flex: 1;
        padding: 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s;
    }

    .search-input:hover {
        border-color: #cbd5e0;
    }

    .search-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .search-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .search-btn {
        padding: 1rem 2rem;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 140px;
        justify-content: center;
    }

    .search-btn:hover:not(:disabled) {
        background: #5568d3;
    }

    .search-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-message {
        padding: 0.75rem;
        background: #fed7d7;
        color: #c53030;
        border-radius: 6px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
    }

    .search-tabs {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }

    .search-tab {
        flex: 1;
        display: flex;
        cursor: pointer;
    }

    .search-tab input[type="radio"] {
        position: absolute;
        opacity: 0;
    }

    .search-tab span {
        flex: 1;
        padding: 0.75rem 1.5rem;
        background: #f7fafc;
        color: #4a5568;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s;
        text-align: center;
    }

    .search-tab input[type="radio"]:checked + span {
        background: #667eea;
        color: white;
        border-color: #667eea;
    }

    .search-tab:hover span {
        border-color: #cbd5e0;
    }

    .search-tab input[type="radio"]:disabled + span {
        opacity: 0.6;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .hero h1 {
            font-size: 2rem;
        }

        .hero-subtitle {
            font-size: 1rem;
        }

        .search-input-group {
            flex-direction: column;
        }

        .search-btn {
            width: 100%;
        }
    }
</style>
