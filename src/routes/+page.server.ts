import { fail, redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import type { ParseSearchResponse } from "$types/api";

export const actions = {
    search: async ({ request, fetch }: RequestEvent) => {
        const formData = await request.formData();
        const query = formData.get("query")?.toString().trim();
        const listingType = formData.get("listingType")?.toString() || "sale";

        if (!query) {
            return fail(400, { error: "Please enter a search query", query: "" });
        }

        try {
            // Call the parse API
            const response = await fetch("/api/v1/search/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) {
                return fail(response.status, {
                    error: "Unable to process your search. Please try again or refine your query.",
                    query,
                });
            }

            const result: ParseSearchResponse = await response.json();

            // Build search URL with parsed criteria
            const params = new URLSearchParams();
            params.set("q", query);
            params.set("listingType", result.criteria.listingType ?? listingType);

            if (result.criteria.suburb) params.set("suburb", result.criteria.suburb);
            if (result.criteria.postcode) params.set("postcode", result.criteria.postcode);
            if (result.criteria.state) params.set("state", result.criteria.state);
            if (result.criteria.propertyType) params.set("propertyType", result.criteria.propertyType);
            if (result.criteria.bedsMin) params.set("bedsMin", String(result.criteria.bedsMin));
            if (result.criteria.bathsMin) params.set("bathsMin", String(result.criteria.bathsMin));
            if (result.criteria.carsMin) params.set("carsMin", String(result.criteria.carsMin));
            if (result.criteria.priceMin) params.set("priceMin", String(result.criteria.priceMin));
            if (result.criteria.priceMax) params.set("priceMax", String(result.criteria.priceMax));

            // Redirect to search page with parsed criteria
            throw redirect(303, `/search?${params.toString()}`);
        } catch (error) {
            // Re-throw redirect errors
            if (error instanceof Response && error.status === 303) {
                throw error;
            }

            console.error("Search error:", error);
            return fail(500, {
                error: "An unexpected error occurred. Please try again.",
                query,
            });
        }
    },
};
