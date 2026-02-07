import type { Handle } from "@sveltejs/kit";

/**
 * SvelteKit server hook — runs on every request.
 * Responsible for session resolution and populating event.locals.user.
 */
export const handle: Handle = async ({ event, resolve }) => {
    // TODO: Phase 3 — resolve session from cookie, populate event.locals.user
    event.locals.user = null;

    const response = await resolve(event);
    return response;
};
