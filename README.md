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

# Natural Language Search (AWS Bedrock)
The platform supports natural language property search using AWS Bedrock (Claude 3 Sonnet).

**Authentication Methods:**

The service uses AWS credential providers with support for multiple authentication methods:

1. **AssumeRole via STS (Recommended for Production)**
   ```bash
   export AWS_REGION=ap-southeast-2
   export AWS_ROLE_ARN=arn:aws:iam::123456789012:role/BedrockSearchRole
   export AWS_ROLE_SESSION_NAME=bedrock-search-session  # Optional
   ```

2. **IAM Roles (Automatic in AWS)**
   - No configuration needed when running on EC2, ECS, or Lambda
   - Just set the region:
   ```bash
   export AWS_REGION=ap-southeast-2
   ```

3. **Access Keys (Local Development Only)**
   ```bash
   export AWS_REGION=ap-southeast-2
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

4. **AWS Profiles**
   - Uses credentials from `~/.aws/credentials` automatically
   - Set `AWS_PROFILE` environment variable to use a specific profile

**Setup:**
1. Enable Claude 3 Sonnet model in AWS Bedrock console
2. Create IAM role/user with `bedrock:InvokeModel` permission
3. Configure authentication using one of the methods above

**API Endpoint:**
```bash
POST /api/v1/search/parse
Content-Type: application/json

{
  "query": "3 bedroom house in Baulkham Hills with swimming pool"
}
```

**Response:**
```json
{
  "criteria": {
    "suburb": "Baulkham Hills",
    "propertyType": "house",
    "bedsMin": 3,
    "features": { "pool": true }
  },
  "confidence": "high",
  "originalQuery": "3 bedroom house in Baulkham Hills with swimming pool"
}
```

The parsed criteria can be directly used with the `/api/v1/listings` search endpoint.
