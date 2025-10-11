# Publish Scalar Projects using GitHub Actions

You can add a GitHub Actions workflow to automatically publish your Scalar projects.

## Basic Workflow

Here's a simple workflow that publishes a Scalar project:

```yaml
name: Publish Scalar Project

on:
  push:
    branches:
      - main

jobs:
  publish-project:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Log in to Scalar
        run: npx @scalar/cli auth login --token ${{ secrets.SCALAR_API_KEY }}

      - name: Publish Project
        run: npx @scalar/cli project publish --slug your-project-slug
```

## Environment-Based Deployment

For different environments:

```yaml
name: Publish Scalar Project

on:
  push:
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

      - name: Set project slug
        if: github.ref == 'refs/heads/main'
        run: echo "PROJECT_SLUG=production-project" >> $GITHUB_ENV

      - name: Set development slug
        if: github.ref == 'refs/heads/development'
        run: echo "PROJECT_SLUG=development-project" >> $GITHUB_ENV

      - name: Publish Project
        run: scalar project publish --slug "$PROJECT_SLUG"
```

## Secrets

To get a `SCALAR_API_KEY` and add it to your GitHub repository, go to https://dashboard.scalar.com/user/api-keys
