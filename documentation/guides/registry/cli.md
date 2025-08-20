# CLI
This guide will help you interact with our registry with our CLI, programmatically. If you want to also work with the registry with our dashboard you can.

### Generate Token
If you choose to interface with our registry with our [CLI](https://guides.scalar.com/scalar/scalar-cli/getting-started) or our API you will need to generate an API key.

Go to https://dashboard.scalar.com and navigate to User > API Keys:

![Scalar Create API Key](https://api.scalar.com/cdn/images/UCkGjASrXpR8OxgWEj32i/RlDb2KoAByHiUPxNsOAHk.png "Scalar Create API Key")

Once you have your API key you can now use the CLI or API to interface with the registry.

## Authentication
First you need to login, you can do that by the following commands:

```bash
scalar auth login
```

Or using a token directly:

```bash
scalar auth login --token 1234secrettoken5678
```

You can also check your current user or logout:

```bash
# Check current user
scalar auth whoami

# Logout
scalar auth logout
```

## Publishing OpenAPI Documents
To add an OpenAPI document to the registry, use the `publish` command:

```bash
scalar registry publish ./openapi.yaml --namespace your-namespace --slug your-slug
```

### Required Parameters
- `file`: Path to your OpenAPI file
- `--namespace`: Your Scalar team namespace
- `--slug`: Unique identifier for the registry entry (defaults to title if not specified)

### Optional Parameters
- `--version`: API version (e.g., 0.1.0)
- `--private`: Make API private (default: false)
- `--force`: Force override an existing version (default: false)

### Examples
```bash
# Basic publish
scalar registry publish api/openapi.json --namespace myteam --slug user-api

# Publish with version and make private
scalar registry publish api/openapi.json --namespace myteam --slug user-api --version 1.0.0 --private

# Force update existing version
scalar registry publish api/openapi.json --namespace myteam --slug user-api --force
```

## Managing Registry Documents

### List Documents
View all registry APIs for your team:

```bash
scalar registry list --namespace your-namespace
```

### Update Document Metadata
Update title and description without re-uploading the file:

```bash
scalar registry update your-namespace your-slug --title "New Title" --description "New description"
```

### Delete Documents
Remove a document from the registry:

```bash
scalar registry delete your-namespace your-slug
```

## Validation and Quality
Before publishing, you can validate your OpenAPI document:

```bash
scalar document validate ./openapi.yaml
```

You can also lint your document using Spectral rules:

```bash
scalar document lint ./openapi.yaml
```

## Team Management
If you're part of multiple teams, you can manage which team is active:

```bash
# List all teams you're part of
scalar team list

# Set active team
scalar team set --team team-uid
```

## Working with Multiple APIs
For repositories containing multiple APIs, you can use the CLI in scripts or CI/CD pipelines:

```bash
# Example: Publish multiple APIs
scalar registry publish ./apis/user-api/openapi.json --namespace myteam --slug user-api
scalar registry publish ./apis/product-api/openapi.json --namespace myteam --slug product-api
scalar registry publish ./apis/order-api/openapi.json --namespace myteam --slug order-api
```

## Integration with CI/CD
For automated publishing, you can integrate the CLI with GitHub Actions or other CI/CD systems. See our [GitHub Actions guide](https://guides.scalar.com/scalar/scalar-registry/github-actions) for detailed examples.

The CLI supports environment variables and can be easily integrated into automated workflows for continuous deployment of your API documentation.
