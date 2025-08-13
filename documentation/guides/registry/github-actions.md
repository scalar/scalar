# Push to the Scalar Registry using GitHub Actions

You can add a GitHub Actions workflow to your GitHub repository to automatically push your OpenAPI documents to the Scalar Registry.

## Basic Workflow

Here's a simple workflow that validates and uploads an OpenAPI document to Scalar:

```yaml
name: Push OpenAPI document to the Scalar Registry

on:
  push:
    branches:
      - main

jobs:
  push-to-scalar-registry:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Validate OpenAPI Document
        run: npx @scalar/cli document validate api/openapi.json

      - name: Log in to Scalar Registry
        run: npx @scalar/cli auth login --token ${{ secrets.SCALAR_API_KEY }}

      - name: Push to Scalar Registry
        run: npx @scalar/cli registry publish --namespace your-namespace --slug your-slug api/openapi.json
```

## Environment-Based Deployment

For projects that need different environments (development, staging, production), you can use conditional logic:

```yaml
name: Publish OpenAPI Document

on:
  push:
    paths:
      - api/**/*.yaml
    branches:
      - main
      - development

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install Scalar CLI
        run: npm install -g @scalar/cli

      - name: Authenticate Scalar
        env:
          SCALAR_API_KEY: ${{ secrets.SCALAR_API_KEY }}
        run: scalar auth login

      - name: Set production namespace
        if: github.ref == 'refs/heads/main'
        run: echo "NAMESPACE=${{ vars.SCALAR_NAMESPACE_PRODUCTION }}" >> $GITHUB_ENV

      - name: Set development namespace
        if: github.ref == 'refs/heads/development'
        run: echo "NAMESPACE=${{ vars.SCALAR_NAMESPACE_DEVELOPMENT }}" >> $GITHUB_ENV

      - name: Publish API
        run: scalar registry version your-api-slug ./api/openapi.json --namespace "$NAMESPACE"
```

## Pull Request Validation

For teams that want to validate OpenAPI documents before merging:

```yaml
name: Validate OpenAPI on Pull Request

on:
  pull_request:
    paths:
      - 'api/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Validate OpenAPI Document
        run: npx @scalar/cli document validate api/openapi.json
```

## Multi-API Repository

For repositories containing multiple APIs:

```yaml
name: Publish Multiple APIs

on:
  push:
    branches:
      - main
    paths:
      - 'apis/**'

jobs:
  publish-apis:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        api:
          - name: 'user-api'
            file: 'apis/user-api/openapi.json'
            slug: 'user-api'
          - name: 'product-api'
            file: 'apis/product-api/openapi.json'
            slug: 'product-api'
          - name: 'order-api'
            file: 'apis/order-api/openapi.json'
            slug: 'order-api'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Validate ${{ matrix.api.name }}
        run: npx @scalar/cli document validate ${{ matrix.api.file }}

      - name: Login to Scalar Registry
        run: npx @scalar/cli auth login --token ${{ secrets.SCALAR_API_KEY }}

      - name: Publish ${{ matrix.api.name }}
        run: |
          npx @scalar/cli registry publish \
            --namespace ${{ vars.SCALAR_NAMESPACE }} \
            --slug ${{ matrix.api.slug }} \
            ${{ matrix.api.file }}
```

## Secrets

To get a `SCALAR_API_KEY` and add it to your GitHub repository, go to https://dashboard.scalar.com/user/api-keys
