/**
 * Bedrock AI service for natural language search parsing.
 * Converts queries like "3 bedroom house in Sydney with pool" into structured search criteria.
 */

import {
    BedrockRuntimeClient,
    InvokeModelCommand,
    type InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";
import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";

/** Structured search criteria extracted from natural language */
export interface ParsedSearchCriteria {
    suburb?: string;
    postcode?: string;
    state?: string;
    propertyType?: string;
    listingType?: string;
    bedsMin?: number;
    bathsMin?: number;
    carsMin?: number;
    priceMin?: number;
    priceMax?: number;
    features?: {
        pool?: boolean;
        airConditioning?: boolean;
        garage?: boolean;
        balcony?: boolean;
        openFireplace?: boolean;
    };
}

/** Response from the NL search parser */
export interface ParseSearchResponse {
    criteria: ParsedSearchCriteria;
    confidence: "high" | "medium" | "low";
    originalQuery: string;
}

/**
 * Initialize Bedrock client using AWS credential providers.
 * 
 * Supports multiple authentication methods (in order of precedence):
 * 1. AssumeRole via STS (if AWS_ROLE_ARN is set)
 * 2. IAM roles (if running on EC2/ECS/Lambda)
 * 3. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)
 * 4. AWS profiles from ~/.aws/credentials
 * 
 * Required environment variables:
 * - AWS_REGION: AWS region (defaults to ap-southeast-2)
 * 
 * Optional for AssumeRole:
 * - AWS_ROLE_ARN: IAM role ARN to assume via STS
 * - AWS_ROLE_SESSION_NAME: Session name for assumed role (defaults to 'bedrock-search-session')
 */
function createBedrockClient(): BedrockRuntimeClient {
    const region = process.env.AWS_REGION ?? "ap-southeast-2";
    const roleArn = process.env.AWS_ROLE_ARN;

    // If AWS_ROLE_ARN is provided, use STS AssumeRole
    if (roleArn) {
        return new BedrockRuntimeClient({
            region,
            credentials: fromTemporaryCredentials({
                params: {
                    RoleArn: roleArn,
                    RoleSessionName: process.env.AWS_ROLE_SESSION_NAME ?? "bedrock-search-session",
                    DurationSeconds: 3600, // 1 hour
                },
            }),
        });
    }

    // Otherwise, use default credential provider chain
    // This automatically handles:
    // - IAM roles for EC2/ECS/Lambda
    // - Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
    // - AWS profiles
    return new BedrockRuntimeClient({
        region,
    });
}

/**
 * Parse natural language property search query using AWS Bedrock.
 * Uses Claude 3 Sonnet to extract structured search criteria.
 */
export async function parseSearchQuery(query: string): Promise<ParseSearchResponse> {
    const client = createBedrockClient();

    const prompt = `You are a real estate search assistant. Extract structured search criteria from the user's natural language query.

User query: "${query}"

Extract the following information if present:
- suburb (Australian suburb name)
- postcode (Australian postcode)
- state (Australian state abbreviation: NSW, VIC, QLD, SA, WA, TAS, NT, ACT)
- propertyType (house, apartment, townhouse, unit, villa, land, rural, commercial)
- listingType (sale, rent, sold, leased, roomshare, holiday_rental)
- bedsMin (minimum number of bedrooms)
- bathsMin (minimum number of bathrooms)
- carsMin (minimum parking spaces)
- priceMin (minimum price in dollars)
- priceMax (maximum price in dollars)
- features (pool, airConditioning, garage, balcony, openFireplace) - set to true if mentioned

Also assess your confidence level: "high" (clearly specified), "medium" (some ambiguity), or "low" (unclear intent).

Respond ONLY with valid JSON in this exact format:
{
    "criteria": {
        "suburb": "string or null",
        "propertyType": "string or null",
        "listingType": "string or null",
        "bedsMin": number or null,
        "bathsMin": number or null,
        "features": {
            "pool": boolean or null
        }
    },
    "confidence": "high|medium|low"
}

Important: 
- Omit fields that are not mentioned or unclear
- Use Australian terminology (e.g., "unit" not "condo")
- Convert informal terms to standard values (e.g., "Sydney" might mean multiple suburbs)
- For price, assume dollars unless currency specified
- Only include features explicitly mentioned`;

    const requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for consistent extraction
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
    };

    const params: InvokeModelCommandInput = {
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(requestBody),
    };

    try {
        const command = new InvokeModelCommand(params);
        const response = await client.send(command);

        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const assistantMessage = responseBody.content[0].text;

        // Extract JSON from the response (Claude may wrap it in markdown)
        const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to extract JSON from Bedrock response");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Clean up null values - only include defined fields
        const cleanedCriteria: ParsedSearchCriteria = {};
        for (const [key, value] of Object.entries(parsed.criteria)) {
            if (value !== null && value !== undefined) {
                if (key === "features" && typeof value === "object") {
                    const cleanedFeatures: Record<string, boolean> = {};
                    for (const [featKey, featValue] of Object.entries(value as Record<string, unknown>)) {
                        if (featValue === true) {
                            cleanedFeatures[featKey] = true;
                        }
                    }
                    if (Object.keys(cleanedFeatures).length > 0) {
                        cleanedCriteria.features = cleanedFeatures as ParsedSearchCriteria["features"];
                    }
                } else {
                    (cleanedCriteria as Record<string, unknown>)[key] = value;
                }
            }
        }

        return {
            criteria: cleanedCriteria,
            confidence: parsed.confidence ?? "medium",
            originalQuery: query,
        };
    } catch (error) {
        console.error("Bedrock search parsing error:", error);
        throw new Error(
            `Failed to parse search query with Bedrock: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
    }
}
