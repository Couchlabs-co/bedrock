# reakiller

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

# Database
Postgres should have the following extensions enabled:
- pg_trgm (for fuzzy text search)
- pgcrypto (optional, not currently used)

If they are not enabled then run the following command:

```bash
bun run src/lib/server/db/setup-extensions.ts
```

To push db schema to database
```bash
bunx drizzle-kit push
```