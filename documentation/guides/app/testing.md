# Testing

Write post-response scripts to automatically validate API responses. Scripts use a Postman-compatible syntax, so if you have used Postman before, you will feel right at home.

## Examples

### Check the status code

```js
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200)
})
```

### Check JSON response

```js
pm.test("Response is valid JSON", () => {
  const responseData = pm.response.json()
  pm.expect(responseData).to.be.an('object')
})
```

### Check response headers

```js
pm.test("Content-Type header is present", () => {
  pm.response.to.have.header('Content-Type')
})
```

### Validate JSON schema

```js
pm.test("Response matches schema", () => {
  const schema = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: { type: 'number' },
      name: { type: 'string' }
    }
  }
  pm.response.to.have.jsonSchema(schema)
})
```

### Check response body

```js
pm.test("Response body contains string", () => {
  pm.expect(pm.response.text()).to.include('success')
})
```

### Successful POST request

```js
pm.test("Successful POST request", () => {
  pm.expect(pm.response.code).to.be.oneOf([201, 202])
})
```

### Negate an assertion

```js
pm.test("Response is not an error", () => {
  pm.expect(pm.response.code).to.not.be.oneOf([400, 500])
  pm.expect(pm.response.json()).to.not.have.property('error')
})
```

### Check header value

```js
pm.test("Content-Type is JSON", () => {
  pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json')
})
```

### Multiple assertions

```js
pm.test("Response has all properties", () => {
  const data = pm.response.json()
  pm.expect(data.type).to.eql('vip')
  pm.expect(data.name).to.be.a('string')
  pm.expect(data.id).to.have.lengthOf(1)
})
```

### Assert data types

```js
pm.test("Response data types are correct", () => {
  const data = pm.response.json()
  pm.expect(data).to.be.an('object')
  pm.expect(data.name).to.be.a('string')
  pm.expect(data.age).to.be.a('number')
  pm.expect(data.hobbies).to.be.an('array')
})
```

### Check object containment

```js
pm.test("Response contains expected object", () => {
  const expected = { created: true, errors: [] }
  pm.expect(pm.response.json()).to.deep.include(expected)
})
```

## Adding Scripts to OpenAPI Documents

You can add post-response scripts directly to your OpenAPI description using the `x-post-response` extension. When the API Client imports the document, scripts are automatically attached to the corresponding operations.

```yaml
openapi: 3.1.0
info:
  title: Example
  version: 1.0
paths:
  '/planets':
    get:
      summary: Get all planets
      x-post-response: |-
        pm.test("Status code is 200", () => {
          pm.response.to.have.status(200)
        })
```

See the [OpenAPI extensions reference](/openapi#x-post-response) for more examples.

## Reference

Scripts run in the official [Postman Sandbox](https://github.com/postmanlabs/postman-sandbox) runtime, so the full `pm` API is available.

### pm.test(name, callback)

Define a named test. The test passes if the callback executes without throwing an error. Returns the `pm` object, so calls can be chained.

```js
pm.test("response is okay to process", () => {
  pm.response.to.not.be.error
  pm.response.to.have.jsonBody('data')
})
```

Async tests are supported by accepting a `done` callback:

```js
pm.test("async test", (done) => {
  setTimeout(() => {
    pm.expect(pm.response.code).to.equal(200)
    done()
  }, 1500)
})
```

Skip a test with `pm.test.skip`:

```js
pm.test.skip("not yet implemented", () => {
  // this test will not run
})
```

### pm.expect(value)

Create an assertion on a value. Uses [Chai BDD](https://www.chaijs.com/api/bdd/) syntax, so all Chai chains are supported.

#### Equality

```js
pm.expect(value).to.equal('exact match')    // strict equality (===)
pm.expect(value).to.eql({ id: 1 })          // deep equality
```

#### Type checks

```js
pm.expect(value).to.be.a('string')
pm.expect(value).to.be.an('object')
pm.expect(value).to.be.true
pm.expect(value).to.be.false
pm.expect(value).to.be.null
pm.expect(value).to.be.undefined
pm.expect(value).to.be.empty
pm.expect(value).to.be.ok               // truthy
```

#### Numbers

```js
pm.expect(count).to.be.above(5)
pm.expect(count).to.be.below(100)
pm.expect(count).to.be.at.least(1)
pm.expect(count).to.be.at.most(50)
pm.expect(count).to.be.within(1, 100)
```

#### Strings and arrays

```js
pm.expect(text).to.include('success')
pm.expect(text).to.match(/^hello/)
pm.expect(list).to.have.lengthOf(3)
pm.expect(list).to.have.members([1, 2, 3])
pm.expect(value).to.be.oneOf([200, 201])
```

#### Objects

```js
pm.expect(obj).to.have.property('name')
pm.expect(obj).to.have.property('name', 'Earth')
pm.expect(obj).to.have.keys(['id', 'name'])
pm.expect(obj).to.have.nested.property('data.items[0].id')
pm.expect(obj).to.deep.include({ id: 1 })
```

#### Negation

Add `.not` to negate any assertion:

```js
pm.expect(value).to.not.equal('error')
pm.expect(list).to.not.be.empty
```

### pm.response

Access the response object inside your scripts.

#### Properties

| Property | Type | Description |
| --- | --- | --- |
| `pm.response.code` | number | HTTP status code |
| `pm.response.status` | string | HTTP status text |
| `pm.response.headers` | HeaderList | Response headers |
| `pm.response.responseTime` | number | Time to receive the response in milliseconds |
| `pm.response.responseSize` | number | Size of the response in bytes |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `pm.response.text()` | string | Response body as a string |
| `pm.response.json()` | object | Parse the response body as JSON |

#### Response assertions

Assert directly on `pm.response` using `.to.have` and `.to.be` chains:

```js
// Status
pm.response.to.have.status(200)
pm.response.to.have.status('OK')

// Headers
pm.response.to.have.header('Content-Type')
pm.response.to.have.header('Content-Type', 'application/json')

// Body
pm.response.to.have.jsonBody('data')
pm.response.to.have.jsonBody('data', { id: 1 })

// JSON Schema validation
pm.response.to.have.jsonSchema({
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'number' } }
})

// Status classes
pm.response.to.be.ok           // 2xx
pm.response.to.be.error        // 4xx or 5xx
pm.response.to.not.be.error

// Negation
pm.response.to.not.have.status(404)
```

### Variables

Read and write variables at different scopes. All scopes support `.get(name)` and `.set(name, value)`.

| Scope | Description |
| --- | --- |
| `pm.variables` | Local to the current script |
| `pm.environment` | Tied to the active environment |
| `pm.collectionVariables` | Shared across the collection |
| `pm.globals` | Available everywhere |

```js
// Read a variable
const token = pm.environment.get('auth_token')

// Write a variable
pm.environment.set('auth_token', 'new-value')
```

Variables resolve in order: local > environment > collection > global.
