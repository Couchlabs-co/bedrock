<!--
    AgentCard — Contact card displaying agent info and agency branding.
    Shows agent name, position, phone, email, and agency logo/name.
-->
<script lang="ts">
    import type { ListingAgentInfo, AgencyInfo } from "$types/api";

    interface Props {
        /** Agent information */
        agent: ListingAgentInfo;
        /** Agency information (shared across agents on the listing) */
        agency?: AgencyInfo | null;
        /** Whether to show the agency info (only for first agent card) */
        showAgency?: boolean;
    }

    let { agent, agency = null, showAgency = false }: Props = $props();

    /** Format phone for tel: link */
    function telHref(phone: string): string {
        return `tel:${phone.replace(/\s/g, "")}`;
    }
</script>

<div class="agent-card">
    <!-- Agent info -->
    <div class="agent-info">
        <div class="agent-avatar" aria-hidden="true">
            {agent.name.charAt(0).toUpperCase()}
        </div>
        <div class="agent-details">
            <p class="agent-name">{agent.name}</p>
            {#if agent.phoneMobile}
                <a href={telHref(agent.phoneMobile)} class="agent-phone">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path
                            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                        />
                    </svg>
                    {agent.phoneMobile}
                </a>
            {:else if agent.phoneOffice}
                <a href={telHref(agent.phoneOffice)} class="agent-phone">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path
                            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                        />
                    </svg>
                    {agent.phoneOffice}
                </a>
            {/if}
            {#if agent.email}
                <a href="mailto:{agent.email}" class="agent-email">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                    </svg>
                    {agent.email}
                </a>
            {/if}
        </div>
    </div>

    <!-- Agency branding -->
    {#if showAgency && agency}
        <div class="agency-info">
            {#if agency.logoUrl}
                <img class="agency-logo" src={agency.logoUrl} alt="{agency.name} logo" loading="lazy" />
            {/if}
            <div class="agency-details">
                <p class="agency-name">{agency.name}</p>
                {#if agency.phone}
                    <a href={telHref(agency.phone)} class="agency-phone">{agency.phone}</a>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .agent-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
        border: 1px solid var(--color-border-light);
        border-radius: var(--radius-lg);
        background: var(--color-bg);
    }

    .agent-info {
        display: flex;
        gap: var(--space-3);
        align-items: flex-start;
    }

    .agent-avatar {
        width: 44px;
        height: 44px;
        border-radius: var(--radius-full);
        background: var(--color-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.125rem;
        flex-shrink: 0;
    }

    .agent-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        min-width: 0;
    }

    .agent-name {
        font-weight: 600;
        font-size: 0.9375rem;
        color: var(--color-text);
    }

    .agent-phone,
    .agent-email {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        font-size: 0.8125rem;
        color: var(--color-text-secondary);
        text-decoration: none;
        word-break: break-all;
    }

    .agent-phone:hover,
    .agent-email:hover {
        color: var(--color-primary);
    }

    /* Agency branding */
    .agency-info {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding-top: var(--space-3);
        border-top: 1px solid var(--color-border-light);
    }

    .agency-logo {
        width: 48px;
        height: 48px;
        object-fit: contain;
        border-radius: var(--radius-sm);
        background: var(--color-bg-secondary);
        flex-shrink: 0;
    }

    .agency-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }

    .agency-name {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-text);
    }

    .agency-phone {
        font-size: 0.75rem;
        color: var(--color-text-secondary);
        text-decoration: none;
    }

    .agency-phone:hover {
        color: var(--color-primary);
    }
</style>
