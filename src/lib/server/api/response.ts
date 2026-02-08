/**
 * Shared API response helpers for consistent JSON responses.
 */

import { json, error } from "@sveltejs/kit";
import type { ZodError } from "zod";
import type { ErrorResponse } from "$types/api";

/**
 * Return a JSON success response.
 */
export function jsonOk<T>(data: T, status: number = 200): Response {
    return json(data, { status });
}

/**
 * Format a Zod validation error into a consistent ErrorResponse.
 */
export function zodErrorResponse(err: ZodError): Response {
    const details: Record<string, string> = {};
    for (const issue of err.issues) {
        const path = issue.path.join(".");
        details[path || "_"] = issue.message;
    }

    const body: ErrorResponse = {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details,
    };

    return json(body, { status: 400 });
}

/**
 * Return a JSON error response using SvelteKit's error helper.
 */
export function apiError(status: number, message: string, code: string = "ERROR"): never {
    error(status, { message, code } as never);
}
