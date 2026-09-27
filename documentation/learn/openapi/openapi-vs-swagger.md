# OpenAPI vs Swagger: what is the difference?

*Last updated: September 2026*

OpenAPI is the name of the specification for describing HTTP APIs; Swagger is the specification's original name and, today, the brand of a family of tools made by SmartBear that work with it. Up to version 2.0 the specification itself was called Swagger. Since the OpenAPI Initiative took it over in 2015, every new version (3.0, 3.1, 3.2) has been called OpenAPI, while names like Swagger UI, Swagger Editor, and Swagger Codegen still refer to specific tools.

So when someone says "our Swagger file," they usually mean an OpenAPI document. When someone says "we use Swagger," they might mean the format, the tools, or both. This guide untangles the two, shows what changed between Swagger 2.0 and OpenAPI 3, and explains which name to use when.

**On this page**

- [The short answer](#the-short-answer)
- [How one name became two](#how-one-name-became-two)
- [OpenAPI vs Swagger at a glance](#openapi-vs-swagger-at-a-glance)
- [The Swagger tools today](#the-swagger-tools-today)
- [Swagger 2.0 vs OpenAPI 3: what changed in the document](#swagger-20-vs-openapi-3-what-changed-in-the-document)
- [Which name should you use?](#which-name-should-you-use)
- [Moving from Swagger 2.0 to OpenAPI 3](#moving-from-swagger-20-to-openapi-3)
- [Do you still need the Swagger tools?](#do-you-still-need-the-swagger-tools)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

- **OpenAPI** = the specification. A vendor-neutral standard, governed by the [OpenAPI Initiative](https://www.openapis.org/about) under the Linux Foundation. Current versions are 3.1 and 3.2. If you want the basics first, read [What is OpenAPI?](/learn/openapi/what-is-openapi)
- **Swagger** = the old name of the specification (1.0 to 2.0), plus the current name of SmartBear's tools: Swagger UI, Swagger Editor, Swagger Codegen, and a commercial platform.
- **"Swagger 2.0"** = the last version released under the Swagger name. It is still the correct way to refer to documents that start with `swagger: "2.0"`.

The specification and the tools are separate things. You can write an OpenAPI document and never touch a Swagger tool, and you can use Swagger UI with documents written by any tool.

## How one name became two

The dates below come from the [revision history in the OpenAPI Specification 3.2.1](https://spec.openapis.org/oas/v3.2.1.html#appendix-a-revision-history) and the Linux Foundation's announcement.

1. **2011: Swagger 1.0.** The Swagger Specification was first released in August 2011, together with tooling to render it.
2. **2014: Swagger 2.0.** Released in September 2014. It became the most widely adopted version of the format.
3. **November 2015: the OpenAPI Initiative.** The Linux Foundation [announced the Open API Initiative](https://www.linuxfoundation.org/press/press-release/new-collaborative-project-to-extend-swagger-specification-for-building-connected-applications-and-services), a collaborative project to extend the Swagger Specification. Founding members included 3Scale, Apigee, Capital One, Google, IBM, Intuit, Microsoft, PayPal, Restlet, and SmartBear.
4. **December 2015: the donation.** SmartBear donated the Swagger Specification. The specification's revision history dates the "Donation of Swagger 2.0 to the OpenAPI Initiative" to December 31, 2015. The OpenAPI Initiative's own site says the specification "was originally based on the Swagger Specification, donated by SmartBear Software."
5. **July 2017: OpenAPI 3.0.** The first release under the new name, and a substantial redesign.
6. **2021 onward: 3.1 and 3.2.** OpenAPI 3.1 (February 2021) aligned schemas with JSON Schema 2020-12. OpenAPI 3.2 followed in September 2025, and 3.2.1 in September 2026. See [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0) for the details.

The specification moved to neutral governance; the Swagger brand stayed with SmartBear. On [swagger.io](https://swagger.io/open-api/), SmartBear describes its tools as "developed by the team behind the original 'Swagger' Specification."

## OpenAPI vs Swagger at a glance

|                          | OpenAPI                                                    | Swagger                                                                                      |
| ------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| What it is today         | A specification for describing HTTP APIs                   | A brand of tools from SmartBear (and the old name of the specification)                      |
| Owned by                 | OpenAPI Initiative, under the Linux Foundation             | SmartBear                                                                                    |
| Versions                 | OpenAPI 3.0, 3.1, 3.2                                      | Swagger 1.x and 2.0 (specification)                                                          |
| First line of a document | `openapi: 3.1.1`                                           | `swagger: "2.0"`                                                                             |
| License                  | Specification under Apache 2.0                             | Swagger UI and Swagger Codegen are open source (Apache 2.0); the commercial platform is paid |
| Examples                 | The OpenAPI 3.2.1 specification, JSON Schema-based schemas | Swagger UI, Swagger Editor, Swagger Codegen, Swagger Core, Swagger Studio                    |
| Correct usage            | "Our OpenAPI document," "an OpenAPI 3.1 description"       | "We render docs with Swagger UI," "this is a Swagger 2.0 file"                               |

## The Swagger tools today

SmartBear maintains the open-source Swagger tools on [github.com/swagger-api](https://github.com/swagger-api):

- **[Swagger UI](https://github.com/swagger-api/swagger-ui)** renders an OpenAPI document as interactive documentation. It is Apache 2.0 licensed and, according to its README's compatibility table (checked September 2026), supports Swagger 2.0 and OpenAPI 3.0, 3.1, and 3.2.0 as of version 5.32.0.
- **Swagger Editor** is a browser-based editor for writing OpenAPI documents with live preview.
- **Swagger Codegen** generates client libraries, server stubs, and documentation from a document. A group of its contributors forked it to create [OpenAPI Generator](https://openapi-generator.tech/docs/fork-qna/), citing, among other reasons, that "Swagger Codegen 3.0.0 was diverging too much from the philosophy of Swagger Codegen 2.x."
- **Swagger Core and Swagger Parser** are Java libraries for producing and parsing documents.

SmartBear's commercial product has changed names more than once. Its documentation currently calls it [Swagger Studio](https://support.smartbear.com/swaggerhub/docs/), "formerly API Hub for Design or SwaggerHub."

None of these tools is required to use OpenAPI. They are one option among many, which is exactly what a vendor-neutral specification is supposed to allow.

## Swagger 2.0 vs OpenAPI 3: what changed in the document

If you work with older APIs you will meet both formats, so it helps to recognize them. Here is the same endpoint in each.

A Swagger 2.0 document:

```yaml
swagger: '2.0'
info:
  title: Pets API
  version: 1.0.0
host: api.example.com
basePath: /v1
schemes:
  - https
consumes:
  - application/json
produces:
  - application/json
paths:
  /pets:
    post:
      summary: Add a pet
      parameters:
        - name: pet
          in: body
          required: true
          schema:
            $ref: '#/definitions/Pet'
      responses:
        '201':
          description: Created.
          schema:
            $ref: '#/definitions/Pet'
securityDefinitions:
  apiKey:
    type: apiKey
    name: X-API-Key
    in: header
definitions:
  Pet:
    type: object
    required: [name]
    properties:
      name:
        type: string
```

The same API as an OpenAPI 3.1 document:

```yaml
openapi: 3.1.1
info:
  title: Pets API
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
paths:
  /pets:
    post:
      summary: Add a pet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
      responses:
        '201':
          description: Created.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
components:
  securitySchemes:
    apiKey:
      type: apiKey
      name: X-API-Key
      in: header
  schemas:
    Pet:
      type: object
      required: [name]
      properties:
        name:
          type: string
```

The structural differences, as described in the [Swagger 2.0](https://spec.openapis.org/oas/v2.0.html) and [OpenAPI 3.1.2](https://spec.openapis.org/oas/v3.1.2.html) specifications:

| Concept                   | Swagger 2.0                                                     | OpenAPI 3.x                                             |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Version field             | `swagger: "2.0"`                                                | `openapi: 3.x.y`                                        |
| Base URL                  | `host` + `basePath` + `schemes`                                 | `servers` array, with variables                         |
| Request body              | A parameter with `in: body`                                     | A dedicated `requestBody`                               |
| Form data                 | Parameters with `in: formData`                                  | `requestBody` with a form or multipart media type       |
| Media types               | Global `consumes` / `produces`                                  | `content` map per request and response                  |
| Reusable pieces           | `definitions`, `parameters`, `responses`, `securityDefinitions` | Everything under `components`                           |
| Multiple example payloads | Limited                                                         | Named `examples` per media type                         |
| Callbacks and links       | Not available                                                   | Available (3.0+)                                        |
| Webhooks                  | Not available                                                   | Top-level `webhooks` (3.1+)                             |
| Schemas                   | Subset of an old JSON Schema draft                              | JSON Schema 2020-12 (3.1+)                              |
| Auth types                | Basic, API key, OAuth 2.0                                       | Adds HTTP bearer, OpenID Connect, and (3.1+) mutual TLS |

## Which name should you use?

Precise language saves confusion in docs, tickets, and job postings. A few rules of thumb:

- Say **OpenAPI** for the specification and for any 3.x document: "the OpenAPI 3.1 document," "our OpenAPI description."
- Say **Swagger 2.0** only for documents that literally declare `swagger: "2.0"`.
- Say **Swagger UI**, **Swagger Editor**, or **Swagger Codegen** when you mean those specific tools.
- Avoid "Swagger spec" for a 3.x document. It is not wrong in everyday speech, but it tells readers you might be on 2.0.

Framework packages keep the old name for historical reasons. `swagger-jsdoc`, NestJS's `@nestjs/swagger`, and .NET's Swashbuckle can all produce OpenAPI 3 documents despite the name. Do not read the package name as a version.

## Moving from Swagger 2.0 to OpenAPI 3

Swagger 2.0 still works in a lot of tools, but newer features (webhooks, JSON Schema 2020-12, multiple examples, better auth modeling) need OpenAPI 3.x. Converting is mostly mechanical:

<scalar-steps>
<scalar-step title="Convert the document">

Run the [Scalar OpenAPI upgrader](/tools/openapi-upgrader/getting-started), which converts Swagger 2.0 to OpenAPI 3.1 in one command:

```bash
npx @scalar/cli document upgrade swagger.json --output openapi.json
```

Or paste the file into the browser-based [OpenAPI converter](/tools/openapi-converter).

</scalar-step>
<scalar-step title="Validate the result">

Check the new document against the specification:

```bash
npx @scalar/cli document validate openapi.json
```

The [OpenAPI validator](/tools/openapi-validator) does the same in the browser.

</scalar-step>
<scalar-step title="Review what automation cannot decide">

Look at request bodies that were split across several `formData` parameters, global `consumes`/`produces` that now appear on every operation, and examples. Then add what 2.0 could not express, such as named examples and webhooks. [OpenAPI documentation](/learn/openapi/openapi-documentation) has tips for each.

</scalar-step>
<scalar-step title="Update the tools that read it">

Point your API reference, SDK generator, mock server, and gateway at the new file, and regenerate anything derived from it.

</scalar-step>
</scalar-steps>

## Do you still need the Swagger tools?

Only if they fit. Because OpenAPI is an open standard, each Swagger tool has alternatives that read the same document. For rendering documentation, the comparison is covered in [Swagger UI alternatives](/alternatives/swagger-ui) and our [Scalar vs Swagger UI migration guide](/resources/migration/swagger-ui). For code generation, see [Swagger Codegen alternatives](/alternatives/swagger-codegen) and [how to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi).

Swagger UI remains a reasonable choice when you need something minimal, familiar to every Java and .NET developer, and already bundled with your framework. If you want a more polished reference with a built-in API client, the [Scalar API reference](/products/api-references) is open source (MIT) and reads the same Swagger 2.0 and OpenAPI 3.x documents. In .NET, for example, Microsoft's ASP.NET Core documentation has a section on [using Scalar for interactive API documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents), and our [ASP.NET Core integration guide](/products/api-references/integrations/aspnetcore/integration) walks through the setup.

## Common mistakes

1. **Assuming "Swagger" means 2.0.** Many "Swagger files" in the wild are OpenAPI 3 documents. Check the first line.
2. **Assuming "OpenAPI" means 3.x only.** Some tools say "OpenAPI 2.0" for Swagger 2.0. The OpenAPI Initiative publishes the [2.0 specification](https://spec.openapis.org/oas/v2.0.html) too, so this is technically accurate, if confusing.
3. **Mixing formats in one document.** A `swagger: "2.0"` document with `components`, or an `openapi: 3.1.1` document with `definitions`, is invalid. Validators check against the declared version.
4. **Treating the renderer as the specification.** If Swagger UI (or any renderer) shows something oddly, that is a tool behavior, not necessarily a document error. Validate before rewriting.
5. **Leaving Swagger 2.0 in place forever.** It works, but you miss out on years of improvements, and newer tools increasingly treat 2.0 as legacy input to upgrade.

## Frequently asked questions

<scalar-detail title="Is Swagger the same as OpenAPI?">
They share a history but are not the same thing today. Swagger was the specification's name up to 2.0. OpenAPI is the name from 3.0 onward. Swagger is now the brand of SmartBear's tools, such as Swagger UI and Swagger Editor.
</scalar-detail>

<scalar-detail title="Is Swagger deprecated?">
The Swagger 2.0 specification has had no new version since 2014 and has been superseded by OpenAPI 3.x, but many tools still accept it. The Swagger tools themselves are actively maintained by SmartBear.
</scalar-detail>

<scalar-detail title="Can Swagger UI render OpenAPI 3.1 documents?">
Yes. According to its README's compatibility table, Swagger UI 5.0.0 added OpenAPI 3.1.0 support, and version 5.32.0 lists 3.2.0 as well.
</scalar-detail>

<scalar-detail title="Why do so many libraries still have swagger in the name?">
Because they were created when Swagger was the specification's name, and renaming a popular package breaks installs. `@nestjs/swagger`, `swagger-jsdoc`, and Swashbuckle can all output OpenAPI 3 documents today.
</scalar-detail>

<scalar-detail title="How do I tell if a file is Swagger 2.0 or OpenAPI 3?">
Look at the first field. `swagger: "2.0"` means Swagger 2.0. `openapi: 3.0.x`, `3.1.x`, or `3.2.x` means OpenAPI 3.
</scalar-detail>

<scalar-detail title="How do I convert Swagger 2.0 to OpenAPI 3.1?">
Run `npx @scalar/cli document upgrade swagger.json --output openapi.json`, then validate the output. The Scalar OpenAPI upgrader is also available as the `@scalar/openapi-upgrader` npm package.
</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0) · [What is an API reference?](/learn/openapi/what-is-an-api-reference)
- **Docs:** [Migrate from Swagger UI to Scalar](/resources/migration/swagger-ui)
- **Product:** [Scalar API reference](/products/api-references) — an open-source renderer for Swagger 2.0 and OpenAPI 3.x documents, with a built-in API client.

---

_Facts about SmartBear, Swagger tools, and OpenAPI Generator are as of September 26, 2026, and are linked to their sources inline. If something has changed, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it._
