/**
 * Root layout server load — runs on every page.
 * Passes the authenticated user (if any) to the client layout.
 */

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
    return {
        user: locals.user,
    };
};
