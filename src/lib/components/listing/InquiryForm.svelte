<!--
    InquiryForm — Contact form for sending inquiries on a listing.
    Public — no login required. Collects name, email, phone, message inline.
    Validates client-side before submission to POST /api/v1/inquiries.
-->
<script lang="ts">
    interface Props {
        /** Listing ID to attach the inquiry to */
        listingId: string;
        /** Agent names for display */
        agentNames?: string[];
    }

    let { listingId, agentNames = [] }: Props = $props();

    /** Form field values */
    let senderName = $state("");
    let senderEmail = $state("");
    let senderPhone = $state("");
    let message = $state("");

    /** Form state */
    let errors = $state<Record<string, string>>({});
    let submitting = $state(false);
    let submitted = $state(false);
    let submitError = $state("");

    /** Client-side validation */
    function validate(): boolean {
        const newErrors: Record<string, string> = {};

        if (!senderName.trim()) {
            newErrors.senderName = "Name is required";
        } else if (senderName.trim().length > 200) {
            newErrors.senderName = "Name must be under 200 characters";
        }

        if (!senderEmail.trim()) {
            newErrors.senderEmail = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
            newErrors.senderEmail = "Please enter a valid email address";
        }

        if (senderPhone && senderPhone.length > 30) {
            newErrors.senderPhone = "Phone must be under 30 characters";
        }

        if (!message.trim()) {
            newErrors.message = "Message is required";
        } else if (message.trim().length > 5000) {
            newErrors.message = "Message must be under 5,000 characters";
        }

        errors = newErrors;
        return Object.keys(newErrors).length === 0;
    }

    /** Submit the inquiry */
    async function handleSubmit(e: SubmitEvent): Promise<void> {
        e.preventDefault();

        if (!validate()) return;

        submitting = true;
        submitError = "";

        try {
            const body: Record<string, string> = {
                listingId,
                senderName: senderName.trim(),
                senderEmail: senderEmail.trim(),
                message: message.trim(),
            };

            if (senderPhone.trim()) {
                body.senderPhone = senderPhone.trim();
            }

            const res = await fetch("/api/v1/inquiries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                submitError = data?.error ?? "Failed to send inquiry. Please try again.";
                return;
            }

            submitted = true;
        } catch {
            submitError = "Network error. Please check your connection and try again.";
        } finally {
            submitting = false;
        }
    }

    /** Reset form to send another inquiry */
    function resetForm(): void {
        senderName = "";
        senderEmail = "";
        senderPhone = "";
        message = "";
        errors = {};
        submitted = false;
        submitError = "";
    }

    /** Default message placeholder */
    let defaultPlaceholder = $derived.by(() => {
        if (agentNames.length > 0) {
            return `Hi ${agentNames[0]}, I'm interested in this property. Could you please provide more information?`;
        }
        return "I'm interested in this property. Could you please provide more information?";
    });
</script>

<section class="inquiry-form" aria-labelledby="inquiry-heading">
    <h3 id="inquiry-heading">Send an Inquiry</h3>

    {#if submitted}
        <!-- Success state -->
        <div class="inquiry-success" role="alert">
            <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-secondary)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p class="success-title">Inquiry Sent!</p>
            <p class="success-message">
                The agent will get back to you shortly. You'll receive a response at <strong
                    >{senderEmail || "your email"}</strong
                >.
            </p>
            <button class="btn btn-outline" onclick={resetForm}> Send Another Inquiry </button>
        </div>
    {:else}
        <!-- Form -->
        <form onsubmit={handleSubmit} novalidate>
            {#if submitError}
                <div class="form-error" role="alert">
                    {submitError}
                </div>
            {/if}

            <!-- Name -->
            <div class="form-group">
                <label for="inquiry-name">
                    Name <span class="required" aria-hidden="true">*</span>
                </label>
                <input
                    id="inquiry-name"
                    type="text"
                    bind:value={senderName}
                    placeholder="Your full name"
                    autocomplete="name"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.senderName}
                    aria-describedby={errors.senderName ? "inquiry-name-error" : undefined}
                />
                {#if errors.senderName}
                    <p class="field-error" id="inquiry-name-error" role="alert">{errors.senderName}</p>
                {/if}
            </div>

            <!-- Email -->
            <div class="form-group">
                <label for="inquiry-email">
                    Email <span class="required" aria-hidden="true">*</span>
                </label>
                <input
                    id="inquiry-email"
                    type="email"
                    bind:value={senderEmail}
                    placeholder="your@email.com"
                    autocomplete="email"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.senderEmail}
                    aria-describedby={errors.senderEmail ? "inquiry-email-error" : undefined}
                />
                {#if errors.senderEmail}
                    <p class="field-error" id="inquiry-email-error" role="alert">{errors.senderEmail}</p>
                {/if}
            </div>

            <!-- Phone -->
            <div class="form-group">
                <label for="inquiry-phone">Phone</label>
                <input
                    id="inquiry-phone"
                    type="tel"
                    bind:value={senderPhone}
                    placeholder="04xx xxx xxx"
                    autocomplete="tel"
                    aria-invalid={!!errors.senderPhone}
                    aria-describedby={errors.senderPhone ? "inquiry-phone-error" : undefined}
                />
                {#if errors.senderPhone}
                    <p class="field-error" id="inquiry-phone-error" role="alert">{errors.senderPhone}</p>
                {/if}
            </div>

            <!-- Message -->
            <div class="form-group">
                <label for="inquiry-message">
                    Message <span class="required" aria-hidden="true">*</span>
                </label>
                <textarea
                    id="inquiry-message"
                    bind:value={message}
                    placeholder={defaultPlaceholder}
                    rows="4"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "inquiry-message-error" : undefined}
                ></textarea>
                {#if errors.message}
                    <p class="field-error" id="inquiry-message-error" role="alert">{errors.message}</p>
                {/if}
                <p class="char-count" class:over={message.length > 5000}>
                    {message.length} / 5,000
                </p>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-primary btn-lg submit-btn" disabled={submitting}>
                {#if submitting}
                    <span class="spinner" aria-hidden="true"></span>
                    Sending…
                {:else}
                    Send Inquiry
                {/if}
            </button>

            <p class="form-note">
                By sending an inquiry you agree to our terms. Your contact details will be shared with the listing
                agent.
            </p>
        </form>
    {/if}
</section>

<style>
    .inquiry-form {
        background: var(--color-bg);
        border: 1px solid var(--color-border-light);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
    }

    .inquiry-form h3 {
        margin-bottom: var(--space-4);
        font-size: 1.125rem;
    }

    /* Success state */
    .inquiry-success {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
        text-align: center;
        padding: var(--space-6) 0;
    }

    .success-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-secondary);
    }

    .success-message {
        color: var(--color-text-secondary);
        max-width: 320px;
    }

    /* Form */
    form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }

    .form-error {
        padding: var(--space-3) var(--space-4);
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: var(--radius-md);
        color: var(--color-danger);
        font-size: 0.875rem;
    }

    :root[data-theme="dark"] .form-error {
        background: rgba(234, 67, 53, 0.1);
        border-color: rgba(234, 67, 53, 0.3);
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }

    label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text);
    }

    .required {
        color: var(--color-danger);
    }

    input,
    textarea {
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font: inherit;
        font-size: 0.9375rem;
        color: var(--color-text);
        background: var(--color-bg);
        transition: border-color var(--transition-base);
    }

    input:focus,
    textarea:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px var(--color-primary-light);
    }

    input[aria-invalid="true"],
    textarea[aria-invalid="true"] {
        border-color: var(--color-danger);
    }

    input[aria-invalid="true"]:focus,
    textarea[aria-invalid="true"]:focus {
        box-shadow: 0 0 0 3px rgba(234, 67, 53, 0.15);
    }

    textarea {
        resize: vertical;
        min-height: 100px;
    }

    .field-error {
        font-size: 0.8125rem;
        color: var(--color-danger);
    }

    .char-count {
        font-size: 0.75rem;
        color: var(--color-text-tertiary);
        text-align: right;
    }

    .char-count.over {
        color: var(--color-danger);
        font-weight: 600;
    }

    .submit-btn {
        width: 100%;
    }

    .form-note {
        font-size: 0.75rem;
        color: var(--color-text-tertiary);
        text-align: center;
        line-height: 1.5;
    }

    /* Spinner */
    .spinner {
        display: inline-block;
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
</style>
