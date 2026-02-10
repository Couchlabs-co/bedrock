# AWS Authentication Configuration Guide

## Quick Reference

| Method | Use Case | Configuration Required | Security Level |
|--------|----------|----------------------|----------------|
| **AssumeRole (STS)** | Production | AWS_REGION, AWS_ROLE_ARN | ⭐⭐⭐⭐⭐ Best |
| **IAM Roles** | AWS Infrastructure (EC2/ECS/Lambda) | AWS_REGION only | ⭐⭐⭐⭐⭐ Best |
| **Access Keys** | Local Development | AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY | ⭐⭐ Use carefully |
| **AWS Profiles** | Local Development | AWS_REGION, AWS_PROFILE (optional) | ⭐⭐⭐ Good |

## Configuration Examples

### Production - AssumeRole via STS

```bash
# .env (production)
AWS_REGION=ap-southeast-2
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/BedrockSearchRole
AWS_ROLE_SESSION_NAME=location-bedrock
```

**IAM Role Setup (Terraform):**
```hcl
resource "aws_iam_role" "bedrock_search" {
  name = "BedrockSearchRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::123456789012:user/location-app"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "bedrock_invoke" {
  name = "BedrockInvokeModel"
  role = aws_iam_role.bedrock_search.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "bedrock:InvokeModel"
        Resource = "arn:aws:bedrock:*:*:model/anthropic.claude-3-sonnet-*"
      }
    ]
  })
}
```

### AWS Infrastructure - IAM Roles

```bash
# .env (EC2/ECS/Lambda)
AWS_REGION=ap-southeast-2
# No credentials needed - provided by AWS infrastructure
```

**EC2 Instance Profile (Terraform):**
```hcl
resource "aws_iam_role" "ec2_bedrock" {
  name = "EC2BedrockRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "bedrock_access" {
  role       = aws_iam_role.ec2_bedrock.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
}

resource "aws_iam_instance_profile" "app" {
  name = "location-app-profile"
  role = aws_iam_role.ec2_bedrock.name
}
```

### Local Development - Access Keys

```bash
# .env (local - DO NOT COMMIT)
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Create IAM User (AWS CLI):**
```bash
# Create user
aws iam create-user --user-name location-bedrock-dev

# Create access key
aws iam create-access-key --user-name location-bedrock-dev

# Attach policy
aws iam attach-user-policy \
  --user-name location-bedrock-dev \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
```

### Local Development - AWS Profile

```bash
# Configure AWS CLI profile
aws configure --profile bedrock-dev
# Enter: Access Key ID, Secret Access Key, Region, Output format

# .env (local)
AWS_REGION=ap-southeast-2
AWS_PROFILE=bedrock-dev
```

**~/.aws/credentials:**
```ini
[bedrock-dev]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
region = ap-southeast-2
```

## Required IAM Permissions

### Minimal Permissions (Recommended)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": [
        "arn:aws:bedrock:ap-southeast-2::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
      ]
    }
  ]
}
```

### Broader Permissions (Development)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "ap-southeast-2"
        }
      }
    }
  ]
}
```

## Troubleshooting

### Error: "The security token included in the request is invalid"
**Cause:** STS role assumption failed
**Solution:** 
1. Verify AWS_ROLE_ARN is correct
2. Check trust policy allows your principal to assume the role
3. Ensure credentials used to assume role are valid

### Error: "Could not load credentials from any providers"
**Cause:** No credentials configured
**Solution:** Set up one of the authentication methods above

### Error: "AccessDeniedException"
**Cause:** Missing `bedrock:InvokeModel` permission
**Solution:** Add Bedrock permissions to your IAM role/user

### Error: "ResourceNotFoundException: Could not resolve the foundation model"
**Cause:** Model not enabled in your AWS region
**Solution:** 
1. Go to AWS Bedrock console
2. Navigate to "Model access"
3. Enable "Anthropic Claude 3 Sonnet"

## Security Best Practices

1. **Use AssumeRole in Production**
   - Temporary credentials expire automatically
   - Easier to rotate and revoke access
   - Better audit trail

2. **Never Commit Credentials**
   - Add `.env` to `.gitignore`
   - Use AWS Secrets Manager or Parameter Store for sensitive data
   - Enable AWS CloudTrail for audit logging

3. **Apply Least Privilege**
   - Grant only `bedrock:InvokeModel` permission
   - Restrict to specific model ARNs
   - Limit to specific regions

4. **Rotate Credentials Regularly**
   - Access keys: Every 90 days
   - STS sessions: Auto-expire (default 1 hour)
   - Review CloudTrail logs for unusual activity

5. **Use IAM Roles When Possible**
   - For EC2/ECS/Lambda deployments
   - No long-lived credentials to manage
   - AWS handles credential rotation

## Testing Authentication

Test your authentication setup:

```bash
# 1. Test AWS credentials
aws sts get-caller-identity

# 2. Test Bedrock access
aws bedrock list-foundation-models --region ap-southeast-2

# 3. Test application endpoint
curl -X POST http://localhost:5173/api/v1/search/parse \
  -H "Content-Type: application/json" \
  -d '{"query": "house in Sydney"}'
```

## Environment-Specific Configurations

### Development
```bash
AWS_REGION=ap-southeast-2
AWS_PROFILE=bedrock-dev  # Or use access keys
```

### Staging
```bash
AWS_REGION=ap-southeast-2
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/BedrockSearchStaging
```

### Production
```bash
AWS_REGION=ap-southeast-2
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/BedrockSearchProduction
# Or use IAM instance roles (no config needed)
```
