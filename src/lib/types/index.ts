/**
 * Re-exports and shared types.
 */

export * from "./api";
export * from "./search";

/**
 * Authenticated user shape passed from server layout to client.
 * Mirrors App.Locals["user"] from app.d.ts.
 */
export type LayoutUser = {
    id: string;
    email: string;
    role: "consumer" | "agent" | "admin";
    firstName: string | null;
    lastName: string | null;
} | null;
