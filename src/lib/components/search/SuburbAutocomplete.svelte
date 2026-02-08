<!--
    SuburbAutocomplete — Debounced suburb/postcode search with keyboard navigation.
    Calls /api/v1/suburbs?q=... to fetch matching suburbs.
    Emits selected suburb via onSelect callback.
-->
<script lang="ts">
    import type { SuburbResult } from "$types/api";

    interface Props {
        /** Current text value */
        value?: string;
        /** Placeholder text */
        placeholder?: string;
        /** Input name attribute */
        name?: string;
        /** Input id attribute */
        id?: string;
        /** Callback when a suburb is selected */
        onSelect?: (suburb: SuburbResult) => void;
        /** Callback when text value changes */
        onInput?: (value: string) => void;
        /** Additional CSS class */
        className?: string;
    }

    let {
        value = "",
        placeholder = "Search suburb, postcode, or address...",
        name = "q",
        id = "suburb-search",
        onSelect,
        onInput,
        className = "",
    }: Props = $props();

    // eslint-disable-next-line svelte/prefer-writable-derived -- inputValue mutated by user input and selection
    let inputValue = $state("");
    let suggestions = $state<SuburbResult[]>([]);

    /** Sync input value when the value prop changes externally */
    $effect(() => {
        inputValue = value ?? "";
    });
    let isOpen = $state(false);
    let activeIndex = $state(-1);
    let isLoading = $state(false);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let inputRef: HTMLInputElement | undefined = $state(undefined);

    /** Debounce delay in ms */
    const DEBOUNCE_MS = 250;
    const MIN_CHARS = 2;

    /**
     * Fetch suburb suggestions from the API.
     */
    async function fetchSuggestions(query: string): Promise<void> {
        if (query.trim().length < MIN_CHARS) {
            suggestions = [];
            isOpen = false;
            isLoading = false;
            return;
        }

        isLoading = true;

        try {
            const res = await fetch(`/api/v1/suburbs?q=${encodeURIComponent(query.trim())}&limit=8`);
            if (res.ok) {
                const data: SuburbResult[] = await res.json();
                suggestions = data;
                isOpen = data.length > 0;
                activeIndex = -1;
            } else {
                suggestions = [];
                isOpen = false;
            }
        } catch {
            suggestions = [];
            isOpen = false;
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle input changes with debounce.
     */
    function handleInput(e: Event): void {
        const target = e.target as HTMLInputElement;
        inputValue = target.value;
        onInput?.(inputValue);

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            fetchSuggestions(inputValue);
        }, DEBOUNCE_MS);
    }

    /**
     * Handle keyboard navigation within the dropdown.
     */
    function handleKeydown(e: KeyboardEvent): void {
        if (!isOpen) {
            if (e.key === "ArrowDown" && suggestions.length > 0) {
                isOpen = true;
                activeIndex = 0;
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                activeIndex = (activeIndex + 1) % suggestions.length;
                break;
            case "ArrowUp":
                e.preventDefault();
                activeIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
                break;
            case "Enter":
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < suggestions.length) {
                    selectSuggestion(suggestions[activeIndex]!);
                }
                break;
            case "Escape":
                isOpen = false;
                activeIndex = -1;
                break;
        }
    }

    /**
     * Select a suburb suggestion.
     */
    function selectSuggestion(suburb: SuburbResult): void {
        inputValue = `${suburb.suburb}, ${suburb.state} ${suburb.postcode}`;
        isOpen = false;
        activeIndex = -1;
        onSelect?.(suburb);
    }

    /**
     * Handle focus out — close dropdown after a short delay
     * so click events on options can fire first.
     */
    function handleBlur(): void {
        setTimeout(() => {
            isOpen = false;
            activeIndex = -1;
        }, 200);
    }

    /** Listbox id for ARIA */
    let listboxId = $derived(`${id}-listbox`);
</script>

<div class="autocomplete {className}">
    <input
        bind:this={inputRef}
        type="text"
        {name}
        {id}
        value={inputValue}
        {placeholder}
        autocomplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        oninput={handleInput}
        onkeydown={handleKeydown}
        onblur={handleBlur}
        onfocus={() => {
            if (suggestions.length > 0) isOpen = true;
        }}
    />

    {#if isLoading}
        <div class="spinner" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
        </div>
    {/if}

    {#if isOpen && suggestions.length > 0}
        <ul id={listboxId} class="suggestions" role="listbox" aria-label="Suburb suggestions">
            {#each suggestions as suburb, i (suburb.suburb + suburb.postcode)}
                <li
                    id="{id}-option-{i}"
                    role="option"
                    aria-selected={i === activeIndex}
                    class="suggestion"
                    class:active={i === activeIndex}
                    onmousedown={() => selectSuggestion(suburb)}
                    onmouseenter={() => {
                        activeIndex = i;
                    }}
                >
                    <span class="suggestion-suburb">{suburb.suburb}</span>
                    <span class="suggestion-meta">{suburb.state} {suburb.postcode}</span>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .autocomplete {
        position: relative;
        width: 100%;
    }

    .autocomplete input {
        width: 100%;
        padding: var(--space-3) var(--space-4);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        font-size: 1rem;
        color: var(--color-text);
        background: var(--color-bg);
        outline: none;
        transition: border-color var(--transition-base);
    }

    .autocomplete input:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px var(--color-primary-light);
    }

    .spinner {
        position: absolute;
        right: var(--space-3);
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-text-tertiary);
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: translateY(-50%) rotate(360deg);
        }
    }

    .suggestions {
        position: absolute;
        top: calc(100% + var(--space-1));
        left: 0;
        right: 0;
        list-style: none;
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: var(--z-dropdown);
        max-height: 300px;
        overflow-y: auto;
    }

    .suggestion {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3) var(--space-4);
        cursor: pointer;
        transition: background var(--transition-fast);
    }

    .suggestion:hover,
    .suggestion.active {
        background: var(--color-bg-secondary);
    }

    .suggestion-suburb {
        font-weight: 500;
        color: var(--color-text);
    }

    .suggestion-meta {
        font-size: 0.8125rem;
        color: var(--color-text-tertiary);
    }
</style>
