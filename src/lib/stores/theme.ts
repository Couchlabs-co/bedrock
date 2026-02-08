/**
 * Theme store — manages light/dark mode toggle.
 * Persists preference in localStorage, falls back to system preference.
 */

import { browser } from "$app/environment";

/** Possible theme values */
export type Theme = "light" | "dark" | "system";

/** Current resolved theme (light or dark) */
let currentTheme = $state<"light" | "dark">("light");

/** User's preference (light, dark, or system) */
let preference = $state<Theme>("system");

/**
 * Resolve the effective theme based on preference and system setting.
 */
function resolveTheme(pref: Theme): "light" | "dark" {
    if (pref === "system") {
        if (browser) {
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return "light";
    }
    return pref;
}

/**
 * Apply theme to the document root element.
 */
function applyTheme(theme: "light" | "dark"): void {
    if (browser) {
        document.documentElement.setAttribute("data-theme", theme);
    }
}

/**
 * Initialise the theme from localStorage or system preference.
 * Call this once in the root layout on mount.
 */
export function initTheme(): void {
    if (!browser) return;

    const stored = localStorage.getItem("location-theme") as Theme | null;
    preference = stored ?? "system";
    currentTheme = resolveTheme(preference);
    applyTheme(currentTheme);

    // Listen for system preference changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (preference === "system") {
            currentTheme = e.matches ? "dark" : "light";
            applyTheme(currentTheme);
        }
    });
}

/**
 * Set the theme preference.
 */
export function setTheme(newPreference: Theme): void {
    preference = newPreference;
    currentTheme = resolveTheme(newPreference);
    applyTheme(currentTheme);

    if (browser) {
        if (newPreference === "system") {
            localStorage.removeItem("location-theme");
        } else {
            localStorage.setItem("location-theme", newPreference);
        }
    }
}

/**
 * Get the current resolved theme (reactive).
 */
export function getTheme(): "light" | "dark" {
    return currentTheme;
}

/**
 * Get the current user preference (reactive).
 */
export function getPreference(): Theme {
    return preference;
}

/**
 * Toggle between light and dark (skips system).
 */
export function toggleTheme(): void {
    setTheme(currentTheme === "light" ? "dark" : "light");
}
