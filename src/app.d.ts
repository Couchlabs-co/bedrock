// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global
{
    namespace App
    {
        // interface Error {}

        interface Locals
        {
            /** The authenticated user, if any. Populated by hooks.server.ts */
            user: {
                id: string;
                email: string;
                role: "consumer" | "agent" | "admin";
                firstName: string | null;
                lastName: string | null;
            } | null;
        }

        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }
}

export {};
