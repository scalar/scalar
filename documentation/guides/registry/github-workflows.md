# GitHub Workflows
Here are some workflows to add to help out with adding Scalar CLI to GitHub


## Env vs Prod OpenAPI Upload
```yaml
name: Publish API Docs
on:
  push:
    paths:
      - openapi/galaxy.yaml
    branches:
      - main
      - develop

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install Scalar
        run: npm install -g @scalar/cli

      - name: Authenticate Scalar
        env:
          SCALAR_API_KEY: ${{ secrets.SCALAR_API_KEY }}
        run: scalar auth login

      - name: Set prod namespace
        if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
        run: echo "NAMESPACE=$(echo $PROD_SCALAR_NAMESPACE)" >> $GITHUB_ENV
        env:
          PROD_SCALAR_NAMESPACE: ${{ vars.PROD_SCALAR_NAMESPACE }}

      - name: Set dev namespace
        if: github.ref == 'refs/heads/develop'
        run: echo "NAMESPACE=$(echo $DEV_SCALAR_NAMESPACE)" >> $GITHUB_ENV
        env:
          DEV_SCALAR_NAMESPACE: ${{ vars.DEV_SCALAR_NAMESPACE }}

      - name: Publish API
        run: scalar registry version scalar-galaxy ./openapi/galaxy.yaml --namespace "$NAMESPACE"

```