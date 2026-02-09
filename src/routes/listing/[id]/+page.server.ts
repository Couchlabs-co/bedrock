/**
 * Listing detail page server load — fetches full listing by ID.
 * SSR for SEO: meta title, description, and Open Graph data.
 */

import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { db } from "$db/connection";
import { getListingById } from "$services/listing-service";
import { z } from "zod";

const uuidSchema = z.string().uuid();

export const load: PageServerLoad = async ({ params }) => {
    const parsed = uuidSchema.safeParse(params.id);

    if (!parsed.success) {
        error(404, "Listing not found");
    }

    const listing = await getListingById(db, parsed.data);

    if (!listing) {
        error(404, "Listing not found");
    }

    // Build SEO meta
    const address = listing.address?.formatted ?? listing.address?.suburb ?? "Property";
    const headline = listing.headline ?? address;

    return {
        listing,
        meta: {
            title: `${headline} | LOCATION`,
            description: listing.description?.slice(0, 160) ?? `View details for ${address}`,
            ogImage: listing.images?.[0]?.urlLarge ?? listing.images?.[0]?.url ?? null,
        },
    };
};
