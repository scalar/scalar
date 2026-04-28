# CLI
This guide will help you interact with our registry with our CLI, programmatically. If you want to also work with the registry with our dashboard you can.

Before running any of the commands below, make sure you are [authenticated](../cli/authentication.md) with the Scalar CLI using your [API key](../cli/authentication.md#login-with-an-api-key).

## Publishing OpenAPI Documents
To add an OpenAPI document to the registry, use the `publish` command:

```bash
scalar registry publish ./openapi.yaml --namespace your-team --slug your-api
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
scalar registry publish api/openapi.json --namespace your-team --slug user-api

# Publish with version and make private
scalar registry publish api/openapi.json --namespace your-team --slug user-api --version 1.0.0 --private

# Force update existing version
scalar registry publish api/openapi.json --namespace your-team --slug user-api --force
```

## Managing Registry Documents

### List Documents
View all registry APIs for your team:

```bash
scalar registry list --namespace your-team
```

### Update Document Metadata
Update title and description without re-uploading the file:

```bash
scalar registry update your-team your-api --title "New Title" --description "New description"
```

### Delete Documents
Remove a document from the registry:

```bash
scalar registry delete your-team your-api
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

And use Rules from the Registry:

```bash
scalar document lint ./openapi.yaml --rule https://registry.scalar.com/@your-team/rules/your-rule
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
scalar registry publish ./apis/user-api/openapi.json --namespace your-team --slug user-api
scalar registry publish ./apis/product-api/openapi.json --namespace your-team --slug product-api
scalar registry publish ./apis/order-api/openapi.json --namespace your-team --slug order-api
```

## Integration with CI/CD
For automated publishing, you can integrate the CLI with GitHub Actions or other CI/CD systems. See our [GitHub Actions guide](../registry/github-actions.md) for detailed examples.

The CLI supports environment variables and can be easily integrated into automated workflows for continuous deployment of your API documentation.
