<!--
    Footer — Site footer with nav links, legal info, and accessibility statement.
-->
<script lang="ts">
    const currentYear = new Date().getFullYear();

    const footerSections = [
        {
            title: "Discover",
            links: [
                { href: "/search?listingType=sale", label: "Buy" },
                { href: "/search?listingType=rent", label: "Rent" },
                { href: "/search?propertyType=commercial", label: "Commercial" },
                { href: "/search?propertyType=land", label: "Land" },
                { href: "/search?propertyType=rural", label: "Rural" },
            ],
        },
        {
            title: "Company",
            links: [
                { href: "/about", label: "About us" },
                { href: "/contact", label: "Contact" },
                { href: "/careers", label: "Careers" },
                { href: "/media", label: "Media" },
            ],
        },
        {
            title: "Support",
            links: [
                { href: "/help", label: "Help centre" },
                { href: "/accessibility", label: "Accessibility" },
                { href: "/privacy", label: "Privacy policy" },
                { href: "/terms", label: "Terms of use" },
            ],
        },
        {
            title: "Agents",
            links: [
                { href: "/agent", label: "Agent dashboard" },
                { href: "/agent/listings/new", label: "List a property" },
                { href: "/agent/import", label: "CRM import" },
                { href: "/advertise", label: "Advertise" },
            ],
        },
    ] as const;
</script>

<footer class="site-footer">
    <div class="container">
        <!-- Link columns -->
        <div class="footer-grid">
            {#each footerSections as section (section.title)}
                <div class="footer-section">
                    <h3 class="footer-heading">{section.title}</h3>
                    <ul class="footer-links">
                        {#each section.links as link (link.href)}
                            <li><a href={link.href}>{link.label}</a></li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>

        <!-- Divider -->
        <hr class="footer-divider" />

        <!-- Bottom bar -->
        <div class="footer-bottom">
            <div class="footer-brand">
                <strong class="footer-logo">LOCATION</strong>
                <p class="footer-tagline">Australia's modern property platform</p>
            </div>

            <div class="footer-legal">
                <p>&copy; {currentYear} LOCATION. All rights reserved.</p>
                <p class="footer-a11y">Committed to making property search accessible to everyone.</p>
            </div>
        </div>
    </div>
</footer>

<style>
    .site-footer {
        margin-top: auto;
        padding: var(--space-12) 0 var(--space-8);
        background: var(--color-bg-secondary);
        border-top: 1px solid var(--color-border);
        color: var(--color-text-secondary);
        font-size: 0.875rem;
    }

    .footer-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-8);
    }

    .footer-heading {
        font-size: 0.8125rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text);
        margin-bottom: var(--space-4);
    }

    .footer-links {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .footer-links a {
        color: var(--color-text-secondary);
        transition: color var(--transition-base);
        text-decoration: none;
    }

    .footer-links a:hover {
        color: var(--color-primary);
        text-decoration: none;
    }

    .footer-divider {
        border: none;
        border-top: 1px solid var(--color-border);
        margin: var(--space-8) 0;
    }

    .footer-bottom {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: var(--space-8);
    }

    .footer-logo {
        font-size: 1.125rem;
        color: var(--color-primary);
        letter-spacing: -0.02em;
    }

    .footer-tagline {
        margin-top: var(--space-1);
        color: var(--color-text-tertiary);
        font-size: 0.8125rem;
    }

    .footer-legal {
        text-align: right;
    }

    .footer-a11y {
        margin-top: var(--space-1);
        color: var(--color-text-tertiary);
        font-size: 0.8125rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--space-6);
        }

        .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-4);
        }

        .footer-legal {
            text-align: left;
        }
    }

    @media (max-width: 480px) {
        .footer-grid {
            grid-template-columns: 1fr;
        }

        .site-footer {
            padding: var(--space-8) 0 var(--space-6);
        }
    }
</style>
