<!--
    MobileNav — Slide-out navigation drawer for mobile devices.
    Includes main nav links, auth actions, and theme toggle.
    Uses a backdrop overlay and traps focus when open.
-->
<script lang="ts">
    import { page } from "$app/stores";
    import { toggleTheme, getTheme } from "$lib/stores/theme";

    interface Props {
        /** Whether the mobile nav is open */
        open: boolean;
        /** Callback to close the nav */
        onClose: () => void;
        /** Authenticated user, if any */
        user: {
            id: string;
            email: string;
            role: "consumer" | "agent" | "admin";
            firstName: string | null;
            lastName: string | null;
        } | null;
    }

    let { open, onClose, user }: Props = $props();

    /** Navigation links */
    const navLinks = [
        { href: "/search?listingType=sale", label: "Buy", icon: "house" },
        { href: "/search?listingType=rent", label: "Rent", icon: "key" },
        { href: "/search?propertyType=commercial", label: "Commercial", icon: "building" },
        { href: "/search?propertyType=land", label: "Land", icon: "map" },
        { href: "/search?propertyType=rural", label: "Rural", icon: "tree" },
    ] as const;

    /** Close on navigation */
    function handleNavClick(): void {
        onClose();
    }

    /** Close on Escape key */
    function handleKeydown(e: KeyboardEvent): void {
        if (e.key === "Escape") {
            onClose();
        }
    }

    /** User display name */
    let displayName = $derived(user ? user.firstName || user.email.split("@")[0] || "Account" : null);
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
    <!-- Backdrop -->
    <div class="backdrop" onclick={onClose} role="presentation" aria-hidden="true"></div>

    <!-- Drawer -->
    <div class="drawer" role="dialog" aria-modal="true" aria-label="Mobile navigation">
        <!-- Header -->
        <div class="drawer-header">
            <strong class="drawer-logo">LOCATION</strong>
            <button class="btn-icon close-btn" onclick={onClose} aria-label="Close navigation menu">
                <svg
                    width="24"
                    height="24"
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
        </div>

        <!-- User info or auth actions -->
        <div class="drawer-auth">
            {#if user}
                <div class="user-info">
                    <div class="user-avatar" aria-hidden="true">
                        {(user.firstName ?? user.email)[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                        <p class="user-name">{displayName}</p>
                        <p class="user-email">{user.email}</p>
                    </div>
                </div>
            {:else}
                <div class="auth-buttons">
                    <a href="/auth/login" class="btn btn-outline" onclick={handleNavClick}>Sign in</a>
                    <a href="/auth/register" class="btn btn-primary" onclick={handleNavClick}>Register</a>
                </div>
            {/if}
        </div>

        <!-- Nav links -->
        <ul class="drawer-links">
            {#each navLinks as link (link.href)}
                <li>
                    <a
                        href={link.href}
                        class="drawer-link"
                        class:active={$page.url.pathname + $page.url.search === link.href}
                        onclick={handleNavClick}
                    >
                        {link.label}
                    </a>
                </li>
            {/each}
        </ul>

        <!-- Account links (authenticated) -->
        {#if user}
            <hr class="drawer-divider" />
            <ul class="drawer-links">
                <li>
                    <a href="/account" class="drawer-link" onclick={handleNavClick}> My account </a>
                </li>
                <li>
                    <a href="/account/favourites" class="drawer-link" onclick={handleNavClick}> Saved properties </a>
                </li>
                <li>
                    <a href="/account/searches" class="drawer-link" onclick={handleNavClick}> Saved searches </a>
                </li>
                {#if user.role === "agent" || user.role === "admin"}
                    <li>
                        <a href="/agent" class="drawer-link" onclick={handleNavClick}> Agent dashboard </a>
                    </li>
                {/if}
                {#if user.role === "admin"}
                    <li>
                        <a href="/admin" class="drawer-link" onclick={handleNavClick}> Admin panel </a>
                    </li>
                {/if}
            </ul>
        {/if}

        <!-- Bottom actions -->
        <div class="drawer-bottom">
            <button class="drawer-link theme-btn" onclick={toggleTheme}>
                {#if getTheme() === "light"}
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    Dark mode
                {:else}
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    >
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    Light mode
                {/if}
            </button>

            {#if user}
                <a href="/auth/logout" class="drawer-link logout-link" onclick={handleNavClick}> Sign out </a>
            {/if}
        </div>
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        z-index: var(--z-overlay);
        background: rgba(0, 0, 0, 0.5);
        animation: fadeIn 0.2s ease;
    }

    .drawer {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: var(--z-modal);
        width: min(320px, 85vw);
        background: var(--color-bg);
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        box-shadow: var(--shadow-xl);
        animation: slideIn 0.25s ease;
    }

    .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4);
        border-bottom: 1px solid var(--color-border);
        min-height: var(--header-height);
    }

    .drawer-logo {
        font-size: 1.125rem;
        color: var(--color-primary);
        letter-spacing: -0.02em;
    }

    .close-btn {
        color: var(--color-text-secondary);
    }

    /* Auth section */
    .drawer-auth {
        padding: var(--space-4);
        border-bottom: 1px solid var(--color-border-light);
        background: var(--color-bg-secondary);
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: var(--space-3);
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-full);
        background: var(--color-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1rem;
        flex-shrink: 0;
    }

    .user-name {
        font-weight: 500;
        color: var(--color-text);
        font-size: 0.9375rem;
    }

    .user-email {
        color: var(--color-text-secondary);
        font-size: 0.8125rem;
    }

    .auth-buttons {
        display: flex;
        gap: var(--space-2);
    }

    .auth-buttons .btn {
        flex: 1;
        justify-content: center;
    }

    /* Nav links */
    .drawer-links {
        list-style: none;
        padding: var(--space-2) 0;
    }

    .drawer-link {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        width: 100%;
        padding: var(--space-3) var(--space-4);
        color: var(--color-text);
        font-weight: 500;
        font-size: 0.9375rem;
        text-decoration: none;
        transition:
            background var(--transition-base),
            color var(--transition-base);
        border: none;
        background: none;
        cursor: pointer;
        text-align: left;
    }

    .drawer-link:hover {
        background: var(--color-bg-secondary);
        color: var(--color-primary);
        text-decoration: none;
    }

    .drawer-link.active {
        color: var(--color-primary);
        background: var(--color-primary-light);
    }

    .drawer-divider {
        border: none;
        border-top: 1px solid var(--color-border-light);
        margin: 0;
    }

    /* Bottom actions */
    .drawer-bottom {
        margin-top: auto;
        border-top: 1px solid var(--color-border-light);
        padding: var(--space-2) 0;
    }

    .theme-btn {
        color: var(--color-text-secondary);
    }

    .logout-link {
        color: var(--color-danger);
    }

    .logout-link:hover {
        color: var(--color-danger);
        background: #ea43351a;
    }

    /* Animations */
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes slideIn {
        from {
            transform: translateX(-100%);
        }
        to {
            transform: translateX(0);
        }
    }
</style>
