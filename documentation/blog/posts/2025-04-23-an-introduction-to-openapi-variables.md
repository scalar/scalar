# An introduction to OpenAPI variables

There are two types of OpenAPI variables:

1. **Server variables:** Strings used specifically in the server URL, primarily used for configuration.
2. **Parameters:** Potentially complex data types used to define data passed through the API.

This guide providers an overview of defining and using both.

## Server variables

API requests need to go somewhere. That is what the URL defines. Server variables enable easy modification of the URL to support developer experience.

For example, if you had an app running on a strange port of a customer’s subdomain, you could define a `customerId` and `port` variable like this:

```
servers:
  - url: https://{customerId}.coolapp.com:{port}/v2
    variables:
      customerId:
        default: scalar
        description: Customer ID assigned by the service provider
      port:
        enum:
          - '443'
          - '8443'
        default: '443'
```

This helps developers on your team know the constraints of the URL as well as easily test multiple configurations of it.

Generally, server variables fit into one of the following use cases:

* Configuring an API to work across dev, staging, and production environments
* Testing APIs across both `http` and `https` protocols
* Allowing flexibility in port selection
* Defining subdomains values for customers, regions, or multi-tenant applications.

## Parameters

Although not named variables, OpenAPI parameters function as variables in your OpenAPI document. They enable you to define data types and expectations for your API.

There are four main types of parameters:

* **Path**, used in URL paths like `/users/{id}` to identify specific resources.
* **Query**, added after a `?` in the URL to optionally filter, sort, and paginate.
* **Header**, sent in HTTP for metadata, auth tokens, and tracking.
* **Cookie**, sent in the cookie header for things like session management, but generally avoided/not recommended.

For example, a basic parameter to get a specific user might look like this:

```
/users/{id}:
  get:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
          minimum: 5
        description: The ID for the user
```

For each parameter, you need to define its `name`, location (`in`), and data type (using `schema` or `content`). Beyond these, there are several other optional attributes like `description` and `required`.

Parameter attributes have many uses including:

* **Constraints** including ones like maximum or minimum number values, string length and patterns, array uniqueness, and enum allowed values.
* **Validation** including basic types like `integer`, data formats like `int64`, and complex objects (built of many constraints). This enables you to sanitize inputs and protect against attack vectors.
* **Defaults** as well as defining whether null values are allowed with `nullable: true`.
* **Style and serialization definition** AKA how arrays and objects are formatted in URLs and headers. For example, `ids=[1,2,3]` changes to:

  * `?ids=1,2,3` when `style: form`
  * `?ids=1%202%203` when `style: spaceDelimited`
  * `?ids=1|2|3` when `style: pipeDelimited`
* **Content types** like `application/json`, `application/xml`, `application/x-www-form-urlencoded`, `text/plain`, `image/png`, `application/pdf`, and their schemas.

For example, to represent a filter that accepts a JSON object with a name and (optionally) age that looks like this `/api/endpoint?filter={"name":"John","age":25}`, you can define the parameter like this:

```
parameters:
  - name: filter
    in: query
    content:
      application/json:
        schema:
          type: object
          required: [name]
          properties:
            name:
              type: string
              minLength: 1
            age:
              type: integer
              minimum: 0
          additionalProperties: false
```

Overall, parameters and their attributes provide a flexible way to create consistent and predictable APIs. They make APIs more approachable and understandable, especially when combined with an API reference and client tool like Scalar.

### Reusing parameters

As a bonus, parameters can also be reused so you don’t need to define them multiple times. This is done by defining them in the components section like this:

```
components:
  parameters:
    ApiVersion:
      name: version
      in: header
      required: true
      schema:
        type: string
        enum: [v1, v2]
    PaginationLimit:
      name: limit
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
```

Once done, you can reference them in your individual paths using `$ref`:

```
paths:
  /users:
    get:
      parameters:
        - $ref: '#/components/parameters/ApiVersion'
        - $ref: '#/components/parameters/PaginationLimit'
```

In a way, this is a sort of meta-level variable, a variable inside a variable.

## The limitation of OpenAPI variables

Although OpenAPI provides a lot of flexibility for defining and using variables, it’s not close to providing everything you could ever want:

* Server variables can only be strings and have limited validation options.
* Parameters don’t support dynamic default values, computed values, or conditional values.
* Parameter schemas don’t support custom validation functions, complex data structures for queries, and other advanced features.
* Descriptions are limited to basic text limiting rich media, interactivity, and markdown.

Luckily, there’s no OpenAPI police going around preventing you from extending or changing how your document is written and processed. You can do whatever you want as long as you do the work to make the functionality work as you expect.

We know because this is exactly what we did when we added environment variables, code samples, internal controls, and more to [our version of the OpenAPI specification](./2025-04-06-how-we-extended-the-openapi-specification.md), which [you can read here](https://github.com/scalar/scalar/blob/main/documentation/openapi.md).

**Apr 23, 2025**
