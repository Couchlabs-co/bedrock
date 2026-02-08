/**
 * API route guard helpers for authentication and role-based access.
 * Uses event.locals.user populated by hooks.server.ts.
 *
 * Phase 3 will implement full auth; these guards enforce the contract now.
 */

import type { RequestEvent } from "@sveltejs/kit";
import { apiError } from "$lib/server/api/response";

/** Authenticated user shape from event.locals */
export type AuthUser = NonNullable<App.Locals["user"]>;

/**
 * Require an authenticated user. Throws 401 if not logged in.
 */
export function requireAuth(event: RequestEvent): AuthUser {
    const user = event.locals.user;
    if (!user) {
        apiError(401, "Authentication required", "UNAUTHORIZED");
    }
    return user;
}

/**
 * Require the user to have one of the specified roles.
 * Throws 401 if not logged in, 403 if wrong role.
 */
export function requireRole(event: RequestEvent, ...roles: AuthUser["role"][]): AuthUser {
    const user = requireAuth(event);
    if (!roles.includes(user.role)) {
        apiError(403, "Insufficient permissions", "FORBIDDEN");
    }
    return user;
}

/**
 * Require the user to be an agent or admin.
 */
export function requireAgent(event: RequestEvent): AuthUser {
    return requireRole(event, "agent", "admin");
}

/**
 * Require the user to be an admin.
 */
export function requireAdmin(event: RequestEvent): AuthUser {
    return requireRole(event, "admin");
}
