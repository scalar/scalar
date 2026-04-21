# Scripts

Pre-request scripts run before a request is sent. Use them to set variables, add headers, generate dynamic values, or prepare authentication tokens.

Scripts use the same Postman-compatible `pm` API as [post-response scripts](./testing.md). They run in the official [Postman Sandbox](https://github.com/postmanlabs/postman-sandbox) runtime.

## Examples

### Set an environment variable

```js
pm.environment.set('timestamp', new Date().toISOString())
```

The variable is available in the request URL, headers, and body as `{{timestamp}}`, and in post-response scripts via `pm.environment.get('timestamp')`.

### Add a header

```js
pm.request.headers.add({
  key: 'X-Request-Id',
  value: 'req-' + Date.now()
})
```

### Set variables for post-response scripts

Variables set in a pre-request script persist into the post-response script for the same request.

```js
pm.globals.set('requestStartTime', Date.now())
```

Then in the post-response script:

```js
pm.test("Request completed quickly", () => {
  const start = pm.globals.get('requestStartTime')
  const duration = Date.now() - start
  pm.expect(duration).to.be.below(2000)
})
```

## pm.request

The `pm.request` object represents the request that is about to be sent. Changes to headers and method are applied to the actual request.

| Property | Type | Description |
| --- | --- | --- |
| `pm.request.method` | string | HTTP method (GET, POST, etc.) |
| `pm.request.url` | Url | Request URL |
| `pm.request.headers` | HeaderList | Request headers |
| `pm.request.body` | RequestBody | Request body |

### Modifying headers

```js
// Add a header
pm.request.headers.add({ key: 'X-Custom', value: 'value' })

// Remove a header
pm.request.headers.remove('X-Custom')
```

### Modifying the method

```js
pm.request.method = 'POST'
```

## Adding Scripts to OpenAPI Documents

Add pre-request scripts to your OpenAPI description using the `x-pre-request` extension. Scripts can be set at the operation level, the document level, or both. When both are present, the document-level script runs first.

### Operation level

```yaml
openapi: 3.1.0
info:
  title: Example
  version: 1.0
paths:
  '/users':
    get:
      summary: Get all users
      x-pre-request: |-
        pm.environment.set('timestamp', new Date().toISOString())
```

### Document level

```yaml
openapi: 3.1.0
info:
  title: Example
  version: 1.0
x-pre-request: |-
  pm.request.headers.add({
    key: 'X-Request-Id',
    value: 'req-' + Date.now()
  })
```

See the [OpenAPI extensions reference](../../openapi.md#x-pre-request) for more details.
