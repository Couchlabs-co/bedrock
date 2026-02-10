# Natural Language Search - Usage Examples

## Overview

The natural language search feature uses AWS Bedrock (Claude 3 Sonnet) to convert plain English property search queries into structured search criteria that can be used with the `/api/v1/listings` endpoint.

## Setup

The service uses AWS credential providers with support for multiple authentication methods. Choose the one that best fits your deployment:

### 1. AssumeRole via STS (Recommended for Production)

This is the most secure approach for production deployments. Your application assumes a temporary IAM role with limited permissions.

**Setup Steps:**
1. Create an IAM role with `bedrock:InvokeModel` permission
2. Set up trust relationship to allow your application to assume the role
3. Configure environment variables:

```bash
# Add to your .env file
AWS_REGION=ap-southeast-2
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/BedrockSearchRole
AWS_ROLE_SESSION_NAME=bedrock-search-session  # Optional, defaults to 'bedrock-search-session'
```

**Benefits:**
- Temporary credentials that auto-rotate
- No long-lived access keys to manage
- Granular permission control per role
- Audit trail via CloudTrail

**Example IAM Role Trust Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:user/your-app-user"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Example IAM Role Permission Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:*:*:model/anthropic.claude-3-sonnet-*"
    }
  ]
}
```

### 2. IAM Roles for EC2/ECS/Lambda (Automatic)

When running on AWS infrastructure, credentials are automatically provided via instance metadata or task roles.

**Setup Steps:**
1. Attach IAM role with `bedrock:InvokeModel` permission to your EC2 instance, ECS task, or Lambda function
2. Set only the region in your environment:

```bash
AWS_REGION=ap-southeast-2
```

**Benefits:**
- Zero configuration in application code
- Credentials managed by AWS
- Most secure for AWS-hosted applications

### 3. Access Keys (Local Development)

Use this method only for local development. Never commit access keys to version control.

**Setup Steps:**
1. Create an IAM user with `bedrock:InvokeModel` permission
2. Generate access keys
3. Add to your .env file (not .env.example):

```bash
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**⚠️ Security Warning:**
- Add `.env` to `.gitignore`
- Never commit credentials to version control
- Rotate keys regularly
- Use least privilege permissions

### 4. AWS Profiles (Local Development)

Uses credentials from `~/.aws/credentials` file automatically.

**Setup Steps:**
1. Configure AWS CLI with your credentials:
   ```bash
   aws configure --profile bedrock-dev
   ```

2. Set environment variables:
   ```bash
   AWS_REGION=ap-southeast-2
   AWS_PROFILE=bedrock-dev  # Optional, uses 'default' profile if not set
   ```

**Credential Provider Chain**

The AWS SDK automatically tries authentication methods in this order:
1. AssumeRole (if `AWS_ROLE_ARN` is set)
2. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
3. IAM roles for EC2/ECS/Lambda
4. AWS profiles from `~/.aws/credentials`

### Enable Claude 3 Sonnet Model
   - Log into AWS Console
   - Navigate to Bedrock service
   - Enable "Anthropic Claude 3 Sonnet" in Model Access
   - Ensure your IAM user/role has `bedrock:InvokeModel` permission

## API Endpoint

**Endpoint:** `POST /api/v1/search/parse`

**Request:**
```json
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
    "features": {
      "pool": true
    }
  },
  "confidence": "high",
  "originalQuery": "3 bedroom house in Baulkham Hills with swimming pool"
}
```

## Example Queries

### Simple Suburb Search
```bash
curl -X POST http://localhost:5173/api/v1/search/parse \
  -H "Content-Type: application/json" \
  -d '{"query": "apartment in Sydney"}'
```

**Response:**
```json
{
  "criteria": {
    "suburb": "Sydney",
    "propertyType": "apartment"
  },
  "confidence": "high",
  "originalQuery": "apartment in Sydney"
}
```

### Complex Search with Features
```bash
curl -X POST http://localhost:5173/api/v1/search/parse \
  -H "Content-Type: application/json" \
  -d '{"query": "4 bed 2 bath house with garage and air conditioning in Melbourne under 800k"}'
```

**Response:**
```json
{
  "criteria": {
    "suburb": "Melbourne",
    "propertyType": "house",
    "bedsMin": 4,
    "bathsMin": 2,
    "priceMax": 800000,
    "features": {
      "garage": true,
      "airConditioning": true
    }
  },
  "confidence": "high",
  "originalQuery": "4 bed 2 bath house with garage and air conditioning in Melbourne under 800k"
}
```

### Rental Search
```bash
curl -X POST http://localhost:5173/api/v1/search/parse \
  -H "Content-Type: application/json" \
  -d '{"query": "rental in Brisbane 2 bedrooms under 500 per week"}'
```

**Response:**
```json
{
  "criteria": {
    "suburb": "Brisbane",
    "listingType": "rent",
    "bedsMin": 2,
    "priceMax": 500
  },
  "confidence": "high",
  "originalQuery": "rental in Brisbane 2 bedrooms under 500 per week"
}
```

## Integration with Listing Search

The parsed criteria can be directly used with the listing search endpoint:

```javascript
// 1. Parse natural language query
const parseResponse = await fetch('/api/v1/search/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query: 'house in Baulkham Hills with pool' 
  })
});

const { criteria } = await parseResponse.json();

// 2. Use parsed criteria for listing search
const searchParams = new URLSearchParams(criteria);
const listingsResponse = await fetch(`/api/v1/listings?${searchParams}`);
const listings = await listingsResponse.json();
```

## Supported Fields

The parser can extract:

- **Location:**
  - `suburb` - Australian suburb name
  - `postcode` - Australian postcode
  - `state` - State abbreviation (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)

- **Property Details:**
  - `propertyType` - house, apartment, townhouse, unit, villa, land, rural, commercial
  - `listingType` - sale, rent, sold, leased, roomshare, holiday_rental

- **Filters:**
  - `bedsMin` - Minimum bedrooms
  - `bathsMin` - Minimum bathrooms
  - `carsMin` - Minimum parking spaces
  - `priceMin` - Minimum price (dollars)
  - `priceMax` - Maximum price (dollars)

- **Features:**
  - `pool` - Swimming pool
  - `airConditioning` - Air conditioning
  - `garage` - Garage
  - `balcony` - Balcony
  - `openFireplace` - Open fireplace

## Confidence Levels

The API returns a confidence level indicating parsing accuracy:

- **`high`**: Clear, unambiguous query with specific criteria
- **`medium`**: Some ambiguity or missing details
- **`low`**: Unclear intent or conflicting requirements

Use the confidence level to decide whether to show the parsed criteria to users for confirmation before searching.

## Error Handling

### Invalid Request
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "query": "String must contain at least 1 character(s)"
  }
}
```

### AWS Configuration Error
```json
{
  "error": "Search service unavailable: AWS credentials not configured",
  "code": "SERVICE_UNAVAILABLE"
}
```

### Parsing Error
```json
{
  "error": "Failed to parse search query",
  "code": "PARSE_ERROR",
  "details": {
    "message": "Failed to extract JSON from Bedrock response"
  }
}
```

## Testing

Run the test suite:
```bash
bun test bedrock-search-parser.test.ts
```

To enable Bedrock integration tests (requires AWS credentials):
```bash
# Unset the skip flag
unset SKIP_BEDROCK_TESTS

# Run tests
bun test bedrock-search-parser.test.ts
```

## Cost Considerations

- **AWS Bedrock Claude 3 Sonnet pricing**: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- Average query costs: $0.001-0.002 per parse request
- Consider implementing:
  - Request caching for common queries
  - Rate limiting per user/IP
  - Usage quotas for free tier users

## Future Enhancements

- [ ] Cache parsed queries (Redis) to reduce Bedrock calls
- [ ] Support for "similar to this property" queries
- [ ] Multi-language support (Chinese, Vietnamese, etc.)
- [ ] Query refinement suggestions ("Did you mean...")
- [ ] Integration with autocomplete/type-ahead
- [ ] Analytics on common search patterns
