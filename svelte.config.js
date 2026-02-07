import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),

    kit: {
        adapter: adapter(),

        alias: {
            $db: "src/lib/server/db",
            $services: "src/lib/server/services",
            $types: "src/lib/types",
            $components: "src/lib/components",
            $stores: "src/lib/stores",
            $utils: "src/lib/utils",
        },
    },
};

export default config;
