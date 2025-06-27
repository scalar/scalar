import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolve } from './resolve'

global.fetch = vi.fn()

function createFetchResponse(data: string, headers: Record<string, string> = {}) {
  return {
    ok: true,
    text: () => new Promise((r) => r(data)),
    headers: new Headers(headers),
  }
}

describe('resolve', () => {
  beforeEach(() => {
    // @ts-expect-error
    global.fetch.mockReset()
  })

  it('returns JSON urls', async () => {
    const result = await resolve('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json')

    expect(result).toBe('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json')
  })

  it('returns YAML urls', async () => {
    const result = await resolve('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml')

    expect(result).toBe('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml')

    const otherResult = await resolve('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yml')

    expect(otherResult).toBe('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yml')
  })

  it('finds URLs from sandbox URL', async () => {
    const result = await resolve('https://sandbox.scalar.com/p/GcxDQ')

    expect(result).toBe('https://sandbox.scalar.com/files/GcxDQ/openapi.yaml')

    const otherResult = await resolve('https://sandbox.scalar.com/e/GcxDQ')

    expect(otherResult).toBe('https://sandbox.scalar.com/files/GcxDQ/openapi.yaml')
  })

  it('finds URL in the CDN example', async () => {
    const html = `<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml')
  })

  it('works with single quote data attributes', async () => {
    const html = `<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url='https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml'></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml')
  })

  it('returns absolute URLs', async () => {
    const html = `<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div data-url="/not-what-we-are-looking-for" id="foobar" />
    <script
      id="api-reference"
      data-url="/openapi.yaml"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://example.com/openapi.yaml')
  })

  it('returns absolute URLs based on the X-Forwarded-Host header', async () => {
    const html = `<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div data-url="/not-what-we-are-looking-for" id="foobar" />
    <script
      id="api-reference"
      data-url="../openapi.yaml"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(
      createFetchResponse(html, {
        'X-Forwarded-Host': 'https://example.com/somewhere/else/',
      }),
    )

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://example.com/somewhere/openapi.yaml')
  })

  it('finds URLs in some wrangled configuration object', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Hono API Reference Demo</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>

    <script
      id="api-reference"
      type="application/json"
      data-configuration="{&amp;quot;spec&amp;quot;:{&amp;quot;url&amp;quot;:&amp;quot;/openapi.yaml&amp;quot;},&amp;quot;pageTitle&amp;quot;:&amp;quot;Hono API Reference Demo&amp;quot;}">

    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://example.com/openapi.yaml')
  })

  it('finds URLs in redoc HTML', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Redoc</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  </head>
  <body>
    <redoc spec-url='https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml')
  })

  it('finds embedded OpenAPI documents', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head />
  <body>
    <script
      id="api-reference"
      type="application/json"
      data-configuration="{&quot;spec&quot;:{&quot;content&quot;:{&quot;openapi&quot;:&quot;3.0.0&quot;,&quot;paths&quot;:{&quot;/&quot;:{&quot;get&quot;:{&quot;operationId&quot;:&quot;AppController_getHello&quot;,&quot;parameters&quot;:[],&quot;responses&quot;:{&quot;200&quot;:{&quot;description&quot;:&quot;&quot;}}}}},&quot;info&quot;:{&quot;title&quot;:&quot;Cats example&quot;,&quot;description&quot;:&quot;The cats API description&quot;,&quot;version&quot;:&quot;1.0&quot;,&quot;contact&quot;:{}},&quot;tags&quot;:[{&quot;name&quot;:&quot;cats&quot;,&quot;description&quot;:&quot;&quot;}],&quot;servers&quot;:[],&quot;components&quot;:{&quot;schemas&quot;:{}}}}}">{"openapi":"3.0.0","paths":{"/":{"get":{"operationId":"AppController_getHello","parameters":[],"responses":{"200":{"description":""}}}}},"info":{"title":"Cats example","description":"The cats API description","version":"1.0","contact":{}},"tags":[{"name":"cats","description":""}],"servers":[],"components":{"schemas":{}}}</script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
    `

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toStrictEqual({
      openapi: '3.0.0',
      paths: {
        '/': {
          get: {
            operationId: 'AppController_getHello',
            parameters: [],
            responses: { '200': { description: '' } },
          },
        },
      },
      info: {
        title: 'Cats example',
        description: 'The cats API description',
        version: '1.0',
        contact: {},
      },
      tags: [{ name: 'cats', description: '' }],
      servers: [],
      components: { schemas: {} },
    })
  })

  it('finds embedded OpenAPI documents, even if they contain HTML tags', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head />
  <body>
    <script
      id="api-reference"
      type="application/json"
      data-configuration="{&quot;spec&quot;:{&quot;content&quot;:{&quot;openapi&quot;:&quot;3.0.0&quot;,&quot;paths&quot;:{&quot;/&quot;:{&quot;get&quot;:{&quot;operationId&quot;:&quot;AppController_getHello&quot;,&quot;parameters&quot;:[],&quot;responses&quot;:{&quot;200&quot;:{&quot;description&quot;:&quot;&quot;}}}}},&quot;info&quot;:{&quot;title&quot;:&quot;Cats example&quot;,&quot;description&quot;:&quot;The cats<br>API description&quot;,&quot;version&quot;:&quot;1.0&quot;,&quot;contact&quot;:{}},&quot;tags&quot;:[{&quot;name&quot;:&quot;cats&quot;,&quot;description&quot;:&quot;&quot;}],&quot;servers&quot;:[],&quot;components&quot;:{&quot;schemas&quot;:{}}}}}"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
    `

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toStrictEqual({
      openapi: '3.0.0',
      paths: {
        '/': {
          get: {
            operationId: 'AppController_getHello',
            parameters: [],
            responses: { '200': { description: '' } },
          },
        },
      },
      info: {
        title: 'Cats example',
        description: 'The cats<br>API description',
        version: '1.0',
        contact: {},
      },
      tags: [{ name: 'cats', description: '' }],
      servers: [],
      components: { schemas: {} },
    })
  })

  it('finds embedded OpenAPI document URLs (JSON)', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head />
  <body>
    <script
      id="api-reference"
      type="application/json"
      data-configuration="{&quot;spec&quot;:{&quot;url&quot;:&quot;/openapi.json&quot;}}">
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
    `

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://example.com/openapi.json')
  })

  it('finds embedded OpenAPI document URLs (JSON) unescaped', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head />
  <body>
    <script
      id="api-reference"
      type="application/json"
      data-configuration='{"url":"/openapi.yaml","hideClientButton":false,"showSidebar":true,"theme":"default","_integration":"hono","layout":"modern","isEditable":false,"hideModels":false,"hideDownloadButton":false,"hideTestRequestButton":false,"hideSearch":false,"hideDarkModeToggle":false,"withDefaultFonts":true}'></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
    `

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://example.com/openapi.yaml')
  })

  it('finds embedded OpenAPI documents (YAML)', async () => {
    const html = `<!DOCTYPE html>
      <html>
        <head />
        <body>

          <script
            id="api-reference"
            type="application/json"
            data-configuration="{&amp;quot;_integration&amp;quot;:&amp;quot;hono&amp;quot;,&amp;quot;spec&amp;quot;:{&amp;quot;content&amp;quot;:&amp;quot;openapi: 3.1.0\ninfo:\n  title: Scalar Galaxy\n  description: |\n    The Scalar Galaxy is an example OpenAPI specification to test OpenAPI tools and libraries. It's a fictional universe with fictional planets and fictional data. Get all the data for [all planets](#tag/planets/GET/planets).\n\n    ## Resources\n\n    * https://github.com/scalar/scalar\n    * https://github.com/OAI/OpenAPI-Specification\n    * https://scalar.com\n\n    ## Markdown Support\n\n    All descriptions *can* contain ~~tons of text~~ **Markdown**. [If GitHub supports the syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax), chances are we're supporting it, too. You can even create [internal links to reference endpoints](#tag/authentication/POST/user/signup).\n\n    &lt;details&gt;\n      &lt;summary&gt;Examples&lt;/summary&gt;\n\n      **Blockquotes**\n\n      &gt; I love OpenAPI. &lt;3\n\n      **Tables**\n\n      | Feature          | Availability |\n      | ---------------- | ------------ |\n      | Markdown Support | ✓            |\n\n      **Accordion**\n\n      \`\`\`html\n      &lt;details&gt;\n        &lt;summary&gt;Using Details Tags&lt;/summary&gt;\n        &lt;p&gt;HTML Example&lt;/p&gt;\n      &lt;/details&gt;\n      \`\`\`\n\n      **Images**\n\n      Yes, there's support for images, too!\n\n      ![Empty placeholder image showing the width/height](https://images.placeholders.dev/?width=1280&amp;height=720)\n\n    &lt;/details&gt;\n  version: 1.0.0\n  contact:\n    name: Marc from Scalar\n    url: https://scalar.com\n    email: marc@scalar.com\nservers:\n  - url: https://galaxy.scalar.com\n  - url: &#39;{protocol}://void.scalar.com/{path}&#39;\n    description: Responds with your request data\n    variables:\n      protocol:\n        enum:\n          - https\n        default: https\n      path:\n        default: &#39;&#39;\nsecurity:\n  - bearerAuth: []\n  - basicAuth: []\n  - apiKeyQuery: []\n  - apiKeyHeader: []\n  - apiKeyCookie: []\n  - oAuth2: []\ntags:\n  - name: Authentication\n    description:\n      Some endpoints are public, but some require authentication. We provide\n      all the required endpoints to create an account and authorize yourself.\n  - name: Planets\n    description: Everything about planets\npaths:\n  &#39;/planets&#39;:\n    get:\n      tags:\n        - Planets\n      summary: Get all planets\n      description: It's easy to say you know them all, but do you really? Retrieve all the planets and check whether you missed one.\n      operationId: getAllData\n      security:\n        - {}\n      parameters:\n        - &#39;$ref&#39;: &#39;#/components/parameters/limit&#39;\n        - &#39;$ref&#39;: &#39;#/components/parameters/offset&#39;\n      responses:\n        &#39;200&#39;:\n          description: OK\n          content:\n            application/json:\n              schema:\n                allOf:\n                  - type: object\n                    properties:\n                      data:\n                        type: array\n                        items:\n                          &#39;$ref&#39;: &#39;#/components/schemas/Planet&#39;\n                  - &#39;$ref&#39;: &#39;#/components/schemas/PaginatedResource&#39;\n    post:\n      tags:\n        - Planets\n      summary: Create a planet\n      description: Time to play god and create a new planet. What do you think? Ah, don't think too much. What could go wrong anyway?\n      operationId: createPlanet\n      requestBody:\n        description: Planet\n        content:\n          application/json:\n            schema:\n              &#39;$ref&#39;: &#39;#/components/schemas/Planet&#39;\n      responses:\n        &#39;201&#39;:\n          description: Created\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/schemas/Planet&#39;\n        &#39;400&#39;:\n          description: Bad Request\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/BadRequest&#39;\n        &#39;403&#39;:\n          description: Forbidden\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/Forbidden&#39;\n  &#39;/planets/{planetId}&#39;:\n    get:\n      tags:\n        - Planets\n      summary: Get a planet\n      description: You'll better learn a little bit more about the planets. It might come in handy once space travel is available for everyone.\n      operationId: getPlanet\n      security:\n        - {}\n      parameters:\n        - &#39;$ref&#39;: &#39;#/components/parameters/planetId&#39;\n      responses:\n        &#39;200&#39;:\n          description: Planet Found\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/schemas/Planet&#39;\n        &#39;404&#39;:\n          description: Planet Not Found\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/NotFound&#39;\n    put:\n      tags:\n        - Planets\n      summary: Update a planet\n      description: Sometimes you make mistakes, that's fine. No worries, you can update all planets.\n      operationId: updatePlanet\n      requestBody:\n        description: New information about the planet\n        content:\n          application/json:\n            schema:\n              &#39;$ref&#39;: &#39;#/components/schemas/Planet&#39;\n      parameters:\n        - &#39;$ref&#39;: &#39;#/components/parameters/planetId&#39;\n      responses:\n        &#39;200&#39;:\n          description: OK\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/schemas/Planet&#39;\n        &#39;400&#39;:\n          description: Bad Request\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/BadRequest&#39;\n        &#39;403&#39;:\n          description: Forbidden\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/Forbidden&#39;\n        &#39;404&#39;:\n          description: Not Found\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/NotFound&#39;\n    delete:\n      tags:\n        - Planets\n      summary: Delete a planet\n      operationId: deletePlanet\n      description:\n        This endpoint was used to delete planets. Unfortunately, that caused\n        a lot of trouble for planets with life. So, this endpoint is now deprecated\n        and should not be used anymore.\n      deprecated: true\n      parameters:\n        - &#39;$ref&#39;: &#39;#/components/parameters/planetId&#39;\n      responses:\n        &#39;204&#39;:\n          description: No Content\n        &#39;404&#39;:\n          description: Not Found\n  &#39;/planets/{planetId}/image&#39;:\n    post:\n      tags:\n        - Planets\n      summary: Upload an image to a planet\n      description: Got a crazy good photo of a planet? Share it with the world!\n      operationId: uploadImage\n      parameters:\n        - &#39;$ref&#39;: &#39;#/components/parameters/planetId&#39;\n      requestBody:\n        content:\n          multipart/form-data:\n            schema:\n              type: object\n              properties:\n                image:\n                  type: string\n                  format: binary\n      responses:\n        &#39;200&#39;:\n          description: Image uploaded\n          content:\n            application/json:\n              schema:\n                type: object\n                properties:\n                  message:\n                    type: string\n                    examples:\n                      - Image uploaded successfully\n        &#39;400&#39;:\n          description: Bad Upload Request\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/BadRequest&#39;\n        &#39;403&#39;:\n          description: Upload Forbidden\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/Forbidden&#39;\n        &#39;404&#39;:\n          description: Failed to Upload Image, Planet Not Found\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/NotFound&#39;\n  &#39;/user/signup&#39;:\n    post:\n      tags:\n        - Authentication\n      summary: Create a user\n      description: Time to create a user account, eh?\n      operationId: createUser\n      security:\n        - {}\n      requestBody:\n        content:\n          application/json:\n            schema:\n              &#39;$ref&#39;: &#39;#/components/schemas/NewUser&#39;\n            examples:\n              Marc:\n                value:\n                  name: Marc\n                  email: marc@scalar.com\n                  password: i-love-scalar\n              Cam:\n                value:\n                  name: Cam\n                  email: cam@scalar.com\n                  password: scalar-is-cool\n      responses:\n        &#39;201&#39;:\n          description: Created\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/schemas/User&#39;\n        &#39;400&#39;:\n          description: Bad Request\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/BadRequest&#39;\n  &#39;/auth/token&#39;:\n    post:\n      tags:\n        - Authentication\n      summary: Get a token\n      description: Yeah, this is the boring security stuff. Just get your super secret token and move on.\n      operationId: getToken\n      security:\n        - {}\n      requestBody:\n        content:\n          application/json:\n            schema:\n              &#39;$ref&#39;: &#39;#/components/schemas/Credentials&#39;\n      responses:\n        &#39;201&#39;:\n          description: Token Created\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/schemas/Token&#39;\n  &#39;/me&#39;:\n    get:\n      tags:\n        - Authentication\n      summary: Get authenticated user\n      description: Find yourself they say. That's what you can do here.\n      operationId: getMe\n      security:\n        - basicAuth: []\n        - oAuth2:\n            - read:account\n        - bearerAuth: []\n        - apiKeyHeader: []\n        - apiKeyQuery: []\n      responses:\n        &#39;200&#39;:\n          description: OK\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/schemas/User&#39;\n        &#39;401&#39;:\n          description: Unauthorized\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/Unauthorized&#39;\n        &#39;403&#39;:\n          description: Forbidden\n          content:\n            application/json:\n              schema:\n                &#39;$ref&#39;: &#39;#/components/responses/Forbidden&#39;\nwebhooks:\n  newPlanet:\n    post:\n      tags:\n        - Planets\n      requestBody:\n        description: Information about a new planet\n        content:\n          application/json:\n            schema:\n              &#39;$ref&#39;: &#39;#/components/schemas/Planet&#39;\n      responses:\n        &#39;200&#39;:\n          description:\n            Return a 200 status to indicate that the data was received\n            successfully\ncomponents:\n  securitySchemes:\n    bearerAuth:\n      type: http\n      scheme: bearer\n    basicAuth:\n      type: http\n      scheme: basic\n    apiKeyHeader:\n      type: apiKey\n      in: header\n      name: X-API-Key\n    apiKeyQuery:\n      type: apiKey\n      in: query\n      name: api_key\n    apiKeyCookie:\n      type: apiKey\n      in: cookie\n      name: api_key\n    oAuth2:\n      type: oauth2\n      flows:\n        authorizationCode:\n          authorizationUrl: https://galaxy.scalar.com/oauth/authorize\n          tokenUrl: https://galaxy.scalar.com/oauth/token\n          scopes:\n            read:account: read your account information\n            write:planets: modify planets in your account\n            read:planets: read your planets\n        clientCredentials:\n          tokenUrl: https://galaxy.scalar.com/oauth/token\n          scopes:\n            read:account: read your account information\n            write:planets: modify planets in your account\n            read:planets: read your planets\n        # Legacy\n        implicit:\n          authorizationUrl: https://galaxy.scalar.com/oauth/authorize\n          scopes:\n            read:account: read your account information\n            write:planets: modify planets in your account\n            read:planets: read your planets\n        # Legacy\n        password:\n          tokenUrl: https://galaxy.scalar.com/oauth/token\n          scopes:\n            read:account: read your account information\n            write:planets: modify planets in your account\n            read:planets: read your planets\n  parameters:\n    planetId:\n      name: planetId\n      in: path\n      required: true\n      schema:\n        type: integer\n        format: int64\n        examples:\n          - 1\n    limit:\n      name: limit\n      in: query\n      description: The number of items to return\n      required: false\n      schema:\n        type: integer\n        format: int64\n        default: 10\n    offset:\n      name: offset\n      in: query\n      description:\n        The number of items to skip before starting to collect the result\n        set\n      required: false\n      schema:\n        type: integer\n        format: int64\n        default: 0\n  responses:\n    BadRequest:\n      description: Bad Request\n      content:\n        application/json:\n          schema:\n            &#39;$ref&#39;: &#39;#/components/schemas/Error&#39;\n    Forbidden:\n      description: Forbidden\n      content:\n        application/json:\n          schema:\n            &#39;$ref&#39;: &#39;#/components/schemas/Error&#39;\n    NotFound:\n      description: NotFound\n      content:\n        application/json:\n          schema:\n            &#39;$ref&#39;: &#39;#/components/schemas/Error&#39;\n    Unauthorized:\n      description: Unauthorized\n      content:\n        application/json:\n          schema:\n            &#39;$ref&#39;: &#39;#/components/schemas/Error&#39;\n  schemas:\n    NewUser:\n      type: object\n      required:\n        - name\n        - email\n        - password\n      properties:\n        name:\n          type: string\n          examples:\n            - Hans\n            - Brynn\n        email:\n          type: string\n          format: email\n          examples:\n            - hans@scalar.com\n            - brynn@scalar.com\n        password:\n          type: string\n          minLength: 8\n          examples:\n            - i-love-scalar\n            - scalar-is-cool\n    User:\n      type: object\n      required:\n        - id\n        - name\n        - email\n      properties:\n        id:\n          type: integer\n          format: int64\n          examples:\n            - 1\n        name:\n          type: string\n          examples:\n            - Marc\n        email:\n          type: string\n          format: email\n          examples:\n            - marc@scalar.com\n    Credentials:\n      type: object\n      required:\n        - email\n        - password\n      properties:\n        email:\n          type: string\n          format: email\n          examples:\n            - marc@scalar.com\n        password:\n          type: string\n          examples:\n            - i-love-scalar\n    Token:\n      type: object\n      properties:\n        token:\n          type: string\n          examples:\n            - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c\n    Planet:\n      type: object\n      required:\n        - id\n        - name\n      properties:\n        id:\n          type: integer\n          format: int64\n          examples:\n            - 1\n          x-variable: planetId\n        name:\n          type: string\n          examples:\n            - Mars\n        description:\n          type:\n            - string\n            - &#39;null&#39;\n          examples:\n            - The red planet\n        image:\n          type: string\n          nullable: true\n          examples:\n            - https://cdn.scalar.com/photos/mars.jpg\n        creator:\n          &#39;$ref&#39;: &#39;#/components/schemas/User&#39;\n    PaginatedResource:\n      type: object\n      properties:\n        meta:\n          type: object\n          properties:\n            limit:\n              type: integer\n              format: int64\n              examples:\n                - 10\n            offset:\n              type: integer\n              format: int64\n              examples:\n                - 0\n            total:\n              type: integer\n              format: int64\n              examples:\n                - 100\n            next:\n              type:\n                - string\n                - &#39;null&#39;\n              examples:\n                - &#39;/planets?limit=10&amp;offset=10&#39;\n    Error:\n      type: object\n      description: RFC 7807 (https://datatracker.ietf.org/doc/html/rfc7807)\n      properties:\n        type:\n          type: string\n          examples:\n            - https://example.com/errors/generic-error\n        title:\n          type: string\n          examples:\n            - Something went wrong here.\n        status:\n          type: integer\n          format: int64\n          examples:\n            - 403\n        detail:\n          type: string\n          examples:\n            - Unfortunately, we can't provide further information.\n&amp;quot;},&amp;quot;pageTitle&amp;quot;:&amp;quot;Scalar Galaxy&amp;quot;}"></script>
          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        </body>
      </html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Scalar Galaxy',
      },
    })
  })

  it('transforms GitHub URLs to raw file URLs', async () => {
    const result = await resolve('https://github.com/outline/openapi/blob/main/spec3.yml')

    expect(result).toBe('https://raw.githubusercontent.com/outline/openapi/refs/heads/main/spec3.yml')
  })

  it('finds embedded OpenAPI document in script tag (JSON)', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head />
  <body>
    <script
        id="api-reference"
        type="application/json">
    {"openapi":"3.1.0","info":{"title":"Hello World","version":"1.0"}}
    </script>
  </body>
</html>
    `

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toStrictEqual({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0',
      },
    })
  })

  it('finds embedded OpenAPI document in script tag, even if it contains HTML tags (JSON)', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head />
  <body>
    <script
        id="api-reference"
        type="application/json">{"openapi":"3.0.0","paths":{"/v1/projects/{ref}/sessions/tags":{"type":"string","pattern":"/^\\s*([a-z0-9_-]+(\\s*,+\\s*)?)*\\s*$/i"}}}</script>
  </body>
</html>
    `

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toStrictEqual({
      openapi: '3.0.0',
      paths: {
        '/v1/projects/{ref}/sessions/tags': {
          pattern: '/^\\s*([a-z0-9_-]+(\\s*,+\\s*)?)*\\s*$/i',
          type: 'string',
        },
      },
    })
  })

  it('finds embedded OpenAPI document in script tag (YAML)', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head />
  <body>
    <script
        id="api-reference"
        type="application/yaml">
openapi: 3.1.0
info:
  title: Hello World
  version: '1.0'
    </script>
  </body>
</html>
    `

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toStrictEqual({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0',
      },
    })
  })

  it('finds OpenAPI URL in HTML link text', async () => {
    const html = `<!DOCTYPE html>
<html>
  <body>
    <p>Fetching spec from <a href="https://example.com/v1/openapi.yml" rel="nofollow" target="_blank">https://example.com/v1/openapi.yml</a></p>
  </body>
</html>
    `

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://example.com/v1/openapi.yml')
  })

  it('finds URL in script configuration', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head />
  <body>
    <script>
      var configuration = {
        isEditable: false,
        layout: "classic",
        darkMode: false,
        searchHotKey: "nope",
        url: "/docs/files/openapi.json",
      }
      var apiReference = document.getElementById('api-reference')
      apiReference.dataset.configuration = JSON.stringify(configuration)
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.20"></script>
  </body>
</html>
    `

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://example.com/docs/files/openapi.json')
  })

  it('returns URL if it directly returns an OpenAPI document', async () => {
    const openApiDoc = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    }

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(JSON.stringify(openApiDoc)))

    const result = await resolve('https://example.com/swagger/json')

    expect(result).toBe('https://example.com/swagger/json')
  })

  it('finds the URL in an escaped JS object', async () => {
    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(
      createFetchResponse(
        `<html>\\"$L8e\\",null,{\\"configuration\\":{\\"spec\\":{\\"url\\":\\"https://raw.githubusercontent.com/Foo/Bar/main/api/foobar.json\\"}},\\"initialRequest`,
      ),
    )

    const result = await resolve('https://example.com/foo')

    expect(result).toBe('https://raw.githubusercontent.com/Foo/Bar/main/api/foobar.json')
  })
})
