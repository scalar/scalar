# CLI
Use the Scalar CLI to publish and manage API documents in the Scalar Registry. You can also manage them in the Scalar dashboard.

Before running any of the commands below, make sure you are [authenticated](../cli/authentication.md) with the Scalar CLI using your [API key](../cli/authentication.md#login-with-an-api-key).

## Publishing API Documents
To add an API document to the Scalar Registry, use the `publish` command:

```bash
scalar registry publish ./openapi.yaml --namespace your-team --slug your-api
```

`publish` accepts OpenAPI and [AsyncAPI](../../asyncapi.md) documents alike. The format is detected when the document reaches the Scalar Registry, so the command is the same either way:

```bash
scalar registry publish ./asyncapi.yaml --namespace your-team --slug your-events-api
```

### Required Parameters
- `file`: Path to your API document
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
Remove a document from the Scalar Registry:

```bash
scalar registry delete your-team your-api
```

## Validation and Quality
Before publishing, you can validate your API document:

```bash
scalar document validate ./openapi.yaml
```

You can also lint your document using Spectral rules:

```bash
scalar document lint ./openapi.yaml
```

Use rules from the Scalar Registry:

```bash
scalar document lint ./openapi.yaml --rule https://registry.scalar.com/@your-team/rules/your-rule
```

> [!NOTE]
> `scalar document validate` and `scalar document lint` both support [AsyncAPI](../../asyncapi.md) documents. Validation detects the document type and checks it against the corresponding OpenAPI or AsyncAPI specification. By default, linting applies Spectral's `spectral:asyncapi` ruleset to AsyncAPI documents and `spectral:oas` to OpenAPI documents.

```bash
scalar document validate ./asyncapi.yaml
scalar document lint ./asyncapi.yaml
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
