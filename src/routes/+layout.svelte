<script lang="ts">
    import "../app.css";
    import { onMount } from "svelte";
    import { initTheme } from "$lib/stores/theme.svelte";
    import Header from "$lib/components/layout/Header.svelte";
    import Footer from "$lib/components/layout/Footer.svelte";
    import MobileNav from "$lib/components/layout/MobileNav.svelte";

    interface Props {
        data: { user: import("$lib/types").LayoutUser };
        children: import("svelte").Snippet;
    }

    let { data, children }: Props = $props();
    let mobileNavOpen = $state(false);

    onMount(() => {
        initTheme();
    });

    function toggleMobileNav(): void {
        mobileNavOpen = !mobileNavOpen;
    }

    function closeMobileNav(): void {
        mobileNavOpen = false;
    }
</script>

<a class="skip-link" href="#main-content">Skip to content</a>

<Header user={data.user} onMenuToggle={toggleMobileNav} />

<MobileNav open={mobileNavOpen} onClose={closeMobileNav} user={data.user} />

<main id="main-content">
    {@render children()}
</main>

<Footer />

<style>
    :global(body) {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    main {
        flex: 1;
    }
</style>
