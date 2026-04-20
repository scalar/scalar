# Environments

Environments store reusable variables that can be referenced across requests. Use them to switch between development, staging, and production, or to manage API keys, tokens, and base URLs without editing each request.

Reference variables anywhere the client accepts strings using double curly braces:

```
GET {{ baseUrl }}/users/{{ userId }}
Authorization: Bearer {{ apiKey }}
```

Variables resolve in the URL, headers, request body, authentication fields, and scripts.

## Create an environment

Open your collection settings and find the **Environment Variables** section. Click **Add Environment**, give it a name, pick a color, and add variables as key-value pairs.

You can create as many environments as you like — one per stage (`development`, `staging`, `production`), one per user, one per tenant, whatever fits your workflow.

## Switch the active environment

Use the environment picker in the request header (the globe icon). Only one environment is active at a time. Switching at any point causes requests to immediately resolve `{{ variables }}` against the newly selected environment. Select **No Environment** to clear the selection.

## Workspace vs collection environments

Environments can live at two levels:

- **Collection** — defined on a single OpenAPI document. Travels with the document when you export it.
- **Workspace** — available to every collection in the current workspace. Not included in exported documents.

Workspace and collection environments are merged at request time, so a collection variable can override a workspace variable with the same name.

## Scopes

Scalar supports four variable scopes, matching the Postman model:

| Scope | Where it lives | Lifetime |
| --- | --- | --- |
| Local | A single request execution | Cleared after the request runs |
| Environment | The active environment | Persists with the collection or workspace |
| Collection | The current collection | Shared by all requests in the collection |
| Global | The workspace | Available everywhere |

When the same variable name is set at multiple scopes, local wins over environment, then collection, then global. See [Testing](./testing.md#variables) for the precedence details used by scripts.

## Using variables in scripts

The same environments are available to pre-request and post-response scripts through the Postman-compatible `pm` API:

```js
// Read a variable from the active environment
const token = pm.environment.get('apiKey')

// Write a value for later requests
pm.environment.set('timestamp', new Date().toISOString())

// Collection-level variable, shared by every request in the collection
pm.collectionVariables.get('baseUrl')

// Workspace-wide global
pm.globals.set('requestId', crypto.randomUUID())
```

See [Scripts](./scripts.md) and [Testing](./testing.md) for more examples.

## Adding Environments to OpenAPI Documents

Define environments directly in your OpenAPI description with the `x-scalar-environments` extension. They are imported automatically and appear in the environment picker.

```yaml
openapi: 3.1.0
info:
  title: Example
  version: 1.0
x-scalar-environments:
  development:
    color: '#00aaff'
    description: Local development
    variables:
      - name: baseUrl
        value: http://localhost:3000
      - name: apiKey
        value: dev-secret
  production:
    color: '#00cc66'
    variables:
      - name: baseUrl
        value: https://api.example.com
      - name: apiKey
        value:
          description: Production API key
          default: ''
```

Each variable's `value` can be a string or an object with an optional `description` and a `default`. The object form is useful when you want to describe what a variable is for and leave the value blank for users to fill in.

See the [OpenAPI extensions reference](../../openapi.md#x-scalar-environments) for more details.
