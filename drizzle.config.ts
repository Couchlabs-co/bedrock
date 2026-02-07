import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/lib/server/db/schema/index.ts",
    out: "./src/lib/server/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL ?? "postgres://location:location@localhost:5432/location",
    },
});
