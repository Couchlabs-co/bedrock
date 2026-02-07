<script lang="ts">
    import "../app.css";

    interface Props {
        children: import("svelte").Snippet;
    }

    let { children }: Props = $props();
</script>

<a class="skip-link" href="#main-content">Skip to content</a>

<header class="site-header">
    <div class="container header-inner">
        <a href="/" class="logo" aria-label="LOCATION — Home">
            <strong>LOCATION</strong>
        </a>

        <nav aria-label="Main navigation">
            <ul class="nav-links">
                <li><a href="/search?listingType=sale">Buy</a></li>
                <li><a href="/search?listingType=rent">Rent</a></li>
                <li><a href="/search?propertyType=commercial">Commercial</a></li>
            </ul>
        </nav>

        <div class="header-actions">
            <!-- TODO: Phase 3 — auth-aware buttons (Login/Register vs Account) -->
            <a href="/auth/login" class="btn btn-outline">Sign in</a>
        </div>
    </div>
</header>

<main id="main-content">
    {@render children()}
</main>

<footer class="site-footer">
    <div class="container footer-inner">
        <p>&copy; {new Date().getFullYear()} LOCATION. All rights reserved.</p>
    </div>
</footer>

<style>
    .site-header {
        position: sticky;
        top: 0;
        z-index: 100;
        height: var(--header-height);
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-border);
    }

    .header-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 100%;
        gap: var(--space-6);
    }

    .logo {
        font-size: 1.25rem;
        color: var(--color-primary);
        text-decoration: none;
        letter-spacing: -0.02em;
    }

    .nav-links {
        display: flex;
        list-style: none;
        gap: var(--space-6);
    }

    .nav-links a {
        color: var(--color-text);
        font-weight: 500;
        font-size: 0.9375rem;
        padding: var(--space-2) 0;
        transition: color 0.15s;
    }

    .nav-links a:hover {
        color: var(--color-primary);
        text-decoration: none;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-md);
        font-weight: 500;
        font-size: 0.875rem;
        transition: all 0.15s;
    }

    .btn-outline {
        border: 1px solid var(--color-border);
        color: var(--color-text);
        background: transparent;
    }

    .btn-outline:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
        text-decoration: none;
    }

    .site-footer {
        margin-top: auto;
        padding: var(--space-8) 0;
        border-top: 1px solid var(--color-border);
        color: var(--color-text-secondary);
        font-size: 0.875rem;
    }

    .footer-inner {
        text-align: center;
    }

    /* Responsive: hide nav links on small screens */
    @media (max-width: 640px) {
        .nav-links {
            display: none;
        }
    }
</style>
