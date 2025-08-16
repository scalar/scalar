# GitLab CI/CD

You can add a GitLab CI/CD pipeline to your GitLab repository to automatically push your OpenAPI documents to the Scalar Registry.

## Basic Pipeline

Here's a simple pipeline that validates and uploads an OpenAPI document to Scalar:

```yaml
stages:
  - validate
  - deploy

validate_openapi:
  stage: validate
  image: node:20
  script:
    - npx @scalar/cli document validate api/openapi.json
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

push_to_scalar_registry:
  stage: deploy
  image: node:20
  script:
    - npx @scalar/cli auth login --token $SCALAR_API_KEY
    - npx @scalar/cli registry publish --namespace your-namespace --slug your-slug api/openapi.json
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  needs:
    - validate_openapi
```

## Environment-Based Deployment

For projects that need different environments (development, staging, production), you can use environment-specific variables:

```yaml
stages:
  - validate
  - deploy

validate_openapi:
  stage: validate
  image: node:20
  script:
    - npx @scalar/cli document validate api/openapi.json
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      changes:
        - api/**/*.yaml
    - if: $CI_COMMIT_BRANCH == "development"
      changes:
        - api/**/*.yaml

deploy_production:
  stage: deploy
  image: node:20
  environment:
    name: production
  script:
    - npx @scalar/cli auth login --token $SCALAR_API_KEY
    - npx @scalar/cli registry publish --namespace $SCALAR_NAMESPACE_PRODUCTION --slug your-api-slug api/openapi.json
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  needs:
    - validate_openapi

deploy_development:
  stage: deploy
  image: node:20
  environment:
    name: development
  script:
    - npx @scalar/cli auth login --token $SCALAR_API_KEY
    - npx @scalar/cli registry publish --namespace $SCALAR_NAMESPACE_DEVELOPMENT --slug your-api-slug api/openapi.json
  rules:
    - if: $CI_COMMIT_BRANCH == "development"
  needs:
    - validate_openapi
```

## Merge Request Validation

For teams that want to validate OpenAPI documents before merging:

```yaml
validate_merge_request:
  stage: validate
  image: node:20
  script:
    - npx @scalar/cli document validate api/openapi.json
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - api/**
```

## Multi-API Repository

For repositories containing multiple APIs using parallel jobs:

```yaml
stages:
  - validate
  - deploy

.validate_template: &validate_template
  stage: validate
  image: node:20
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      changes:
        - apis/**

.deploy_template: &deploy_template
  stage: deploy
  image: node:20
  before_script:
    - npx @scalar/cli auth login --token $SCALAR_API_KEY
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

validate_user_api:
  <<: *validate_template
  script:
    - npx @scalar/cli document validate apis/user-api/openapi.json

validate_product_api:
  <<: *validate_template
  script:
    - npx @scalar/cli document validate apis/product-api/openapi.json

validate_order_api:
  <<: *validate_template
  script:
    - npx @scalar/cli document validate apis/order-api/openapi.json

deploy_user_api:
  <<: *deploy_template
  script:
    - npx @scalar/cli registry publish --namespace $SCALAR_NAMESPACE --slug user-api apis/user-api/openapi.json
  needs:
    - validate_user_api

deploy_product_api:
  <<: *deploy_template
  script:
    - npx @scalar/cli registry publish --namespace $SCALAR_NAMESPACE --slug product-api apis/product-api/openapi.json
  needs:
    - validate_product_api

deploy_order_api:
  <<: *deploy_template
  script:
    - npx @scalar/cli registry publish --namespace $SCALAR_NAMESPACE --slug order-api apis/order-api/openapi.json
  needs:
    - validate_order_api
```

## Using Matrix Jobs (Alternative for Multi-API)

GitLab also supports parallel matrix jobs for cleaner configuration:

```yaml
stages:
  - validate
  - deploy

validate_apis:
  stage: validate
  image: node:20
  parallel:
    matrix:
      - API_NAME: "user-api"
        API_FILE: "apis/user-api/openapi.json"
      - API_NAME: "product-api"
        API_FILE: "apis/product-api/openapi.json"
      - API_NAME: "order-api"
        API_FILE: "apis/order-api/openapi.json"
  script:
    - npx @scalar/cli document validate $API_FILE
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      changes:
        - apis/**

deploy_apis:
  stage: deploy
  image: node:20
  parallel:
    matrix:
      - API_NAME: "user-api"
        API_FILE: "apis/user-api/openapi.json"
        API_SLUG: "user-api"
      - API_NAME: "product-api"
        API_FILE: "apis/product-api/openapi.json"
        API_SLUG: "product-api"
      - API_NAME: "order-api"
        API_FILE: "apis/order-api/openapi.json"
        API_SLUG: "order-api"
  script:
    - npx @scalar/cli auth login --token $SCALAR_API_KEY
    - npx @scalar/cli registry publish --namespace $SCALAR_NAMESPACE --slug $API_SLUG $API_FILE
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  needs:
    - validate_apis
```

## Variables and Secrets

To set up the required variables in GitLab:

1. **CI/CD Variables**: Go to your project's Settings → CI/CD → Variables
2. **Required Variables**:
   - `SCALAR_API_KEY` (masked): Get this from https://dashboard.scalar.com/user/api-keys
   - `SCALAR_NAMESPACE` or `SCALAR_NAMESPACE_PRODUCTION`/`SCALAR_NAMESPACE_DEVELOPMENT`: Your organization namespace
