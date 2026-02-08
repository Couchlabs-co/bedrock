<!--
    Header — Responsive site header with logo, navigation, search bar, and auth actions.
    Auth-aware: shows Sign in / Register for guests, account menu for authenticated users.
-->
<script lang="ts">
    import { page } from "$app/stores";
    import { toggleTheme, getTheme } from "$lib/stores/theme.svelte";

    interface Props {
        /** Authenticated user, if any */
        user: {
            id: string;
            email: string;
            role: "consumer" | "agent" | "admin";
            firstName: string | null;
            lastName: string | null;
        } | null;
        /** Callback to open mobile nav */
        onMenuToggle: () => void;
    }

    let { user, onMenuToggle }: Props = $props();

    /** Navigation links */
    const navLinks = [
        { href: "/search?listingType=sale", label: "Buy" },
        { href: "/search?listingType=rent", label: "Rent" },
        { href: "/search?propertyType=commercial", label: "Commercial" },
    ] as const;

    /**
     * Check if a nav link is currently active.
     */
    function isActive(href: string): boolean {
        const currentPath = $page.url.pathname + $page.url.search;
        return currentPath.startsWith(href);
    }

    /** User display name */
    let displayName = $derived(user ? user.firstName || user.email.split("@")[0] || "Account" : null);
</script>

<header class="site-header">
    <div class="container header-inner">
        <!-- Mobile menu button -->
        <button
            class="menu-btn btn-icon"
            onclick={onMenuToggle}
            aria-label="Open navigation menu"
            aria-expanded="false"
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
            >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
        </button>

        <!-- Logo -->
        <a href="/" class="logo" aria-label="LOCATION — Home">
            <strong>LOCATION</strong>
        </a>

        <!-- Desktop navigation -->
        <nav class="desktop-nav" aria-label="Main navigation">
            <ul class="nav-links">
                {#each navLinks as link (link.href)}
                    <li>
                        <a
                            href={link.href}
                            class:active={isActive(link.href)}
                            aria-current={isActive(link.href) ? "page" : undefined}
                        >
                            {link.label}
                        </a>
                    </li>
                {/each}
            </ul>
        </nav>

        <!-- Right-side actions -->
        <div class="header-actions">
            <!-- Theme toggle -->
            <button
                class="btn-icon theme-toggle"
                onclick={toggleTheme}
                aria-label="Toggle {getTheme() === 'light' ? 'dark' : 'light'} mode"
                title="Toggle theme"
            >
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
                {/if}
            </button>

            {#if user}
                <!-- Authenticated: account links -->
                {#if user.role === "agent" || user.role === "admin"}
                    <a href="/agent" class="btn btn-ghost btn-sm">Dashboard</a>
                {/if}
                <a href="/account" class="btn btn-outline btn-sm">
                    {displayName}
                </a>
            {:else}
                <!-- Guest: sign in / register -->
                <a href="/auth/login" class="btn btn-ghost btn-sm auth-link">Sign in</a>
                <a href="/auth/register" class="btn btn-primary btn-sm auth-link">Register</a>
            {/if}
        </div>
    </div>
</header>

<style>
    .site-header {
        position: sticky;
        top: 0;
        z-index: var(--z-sticky);
        height: var(--header-height);
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-border);
        backdrop-filter: blur(8px);
        background: color-mix(in srgb, var(--color-bg) 85%, transparent);
    }

    .header-inner {
        display: flex;
        align-items: center;
        height: 100%;
        gap: var(--space-4);
    }

    /* Logo */
    .logo {
        font-size: 1.25rem;
        color: var(--color-primary);
        text-decoration: none;
        letter-spacing: -0.02em;
        flex-shrink: 0;
    }

    .logo:hover {
        text-decoration: none;
    }

    /* Desktop nav */
    .desktop-nav {
        flex: 1;
        display: flex;
        justify-content: center;
    }

    .nav-links {
        display: flex;
        list-style: none;
        gap: var(--space-1);
    }

    .nav-links a {
        display: block;
        color: var(--color-text);
        font-weight: 500;
        font-size: 0.9375rem;
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md);
        transition:
            color var(--transition-base),
            background var(--transition-base);
        text-decoration: none;
    }

    .nav-links a:hover {
        color: var(--color-primary);
        background: var(--color-bg-secondary);
    }

    .nav-links a.active {
        color: var(--color-primary);
        background: var(--color-primary-light);
    }

    /* Actions */
    .header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-shrink: 0;
    }

    .theme-toggle {
        color: var(--color-text-secondary);
    }

    /* Mobile hamburger — hidden on desktop */
    .menu-btn {
        display: none;
        color: var(--color-text);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .menu-btn {
            display: flex;
        }

        .desktop-nav {
            display: none;
        }

        .auth-link {
            display: none;
        }

        .header-inner {
            gap: var(--space-2);
        }

        .logo {
            flex: 1;
        }
    }
</style>
