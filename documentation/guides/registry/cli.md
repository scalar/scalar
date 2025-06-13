# CLI
This guide will help you interact with our registry with our CLI, programatically. If you want to also work with the registry with our cloud dashboard you can.

### Generate Token
If you choose to interface with our registry with our [CLI](/scalar/scalar-cli/getting-started) or our API you will need to generate an API key this can be done in two steps

Go to https://dashboard.scalar.com and navigate to User > API Keys
![Scalar Create API Key](https://api.scalar.com/cdn/images/UCkGjASrXpR8OxgWEj32i/RlDb2KoAByHiUPxNsOAHk.png "Scalar Create API Key")

Once you have your API key you can now use the CLI or API to interface with the registry.

## Add an OpenAPI Document
Now let's add an OpenAPI document to the registry ✨

First you need to login, you can do that by the following two commands

```bash
scalar auth login
```

or

```bash
scalar auth login --token 1234secrettoken5678
```

Now you can interface with the registry by

```bash
scalar registry create ./openapi.yaml
```

## Update an OpenAPI Document
Once you have an OpenAPI document on our registry, you can push up changes by a simple CLI call
```bash
scalar registry version scalar-galaxy ./openapi/galaxy.yaml --namespace scalar
```

## Delete an OpenAPI Document
You can delete an OpenAPI document from the Registry > Overview page, however please consider the downstream effects of which products are depending on that OpenAPI document before deleting that resource.

```bash
scalar registry delete scalar-galaxy --namespace scalar
```


