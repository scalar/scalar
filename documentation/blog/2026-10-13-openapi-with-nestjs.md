---
date: 2026-10-13
---

# OpenAPI with NestJS

*By Marc Laventure*

NestJS generates an OpenAPI document from your controllers and DTOs through the official `@nestjs/swagger` package. Add it, build a document in `main.ts`, and the JSON is served next to your API. Like most code-first generators, the setup takes five minutes and the accuracy takes longer, because TypeScript types disappear at runtime and Nest can only document what it can see.

This is part one of a three-part series, and it is vendor-neutral. Everything here is standard NestJS and works the same whichever documentation UI, SDK generator or linter reads the result. Part two covers what you can build from the document, and part three walks through one concrete setup.

The package is called `@nestjs/swagger` for historical reasons. What it produces is an OpenAPI document; "Swagger" survives in the name and in the bundled Swagger UI. Behaviour below matches the [NestJS OpenAPI documentation](https://docs.nestjs.com/openapi/introduction) and the [`nestjs/swagger` source](https://github.com/nestjs/swagger) as of September 2026.

## Install and bootstrap

```shell
npm install --save @nestjs/swagger
```

If you use the Fastify adapter, also install `@fastify/static`.

Then build the document in `main.ts`:

```ts
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = new DocumentBuilder()
    .setTitle('Bookstore API')
    .setDescription('Books, authors and orders.')
    .setVersion('1.0.0')
    .addTag('books')
    .build()

  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, documentFactory)

  await app.listen(3000)
}
bootstrap()
```

Passing a factory instead of a finished document is the current recommended form: Nest builds the document on the first request, not during startup.

With that in place:

| URL | What it is |
| --- | --- |
| `/api` | Swagger UI |
| `/api-json` | The OpenAPI document as JSON |
| `/api-yaml` | The same document as YAML |

All three are configurable through the fourth argument to `setup()`, which takes options such as `jsonDocumentUrl`, `yamlDocumentUrl`, `ui` (set it to `false` to serve only the document) and `raw` (choose which formats are exposed). `useGlobalPrefix: true` puts them under your global prefix.

## Which OpenAPI version you get

The document declares `openapi: 3.0.0` by default; that is the base document in the [package source](https://github.com/nestjs/swagger/blob/master/lib/fixtures/document.base.ts). `DocumentBuilder.setOpenAPIVersion('3.1.0')` changes the declared version. Changing the number does not by itself rewrite schemas into 3.1 style, so if you declare a newer version, run the output through a validator for that version before you rely on it. Recent releases of the package have started to add newer features, such as hierarchical tags through `addTag()`; check the [operations page](https://docs.nestjs.com/openapi/operations) for what your installed version supports.

For most teams, a correct 3.0 document is a fine starting point. Every documentation UI and SDK generator you are likely to use reads it. Our [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0) guide explains what you gain by moving.

## Why DTOs need help

Here is the core problem. This controller looks fully typed:

```ts
@Controller('books')
export class BooksController {
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Book> {
    return this.booksService.findOne(id)
  }
}
```

But TypeScript interfaces and type annotations are erased at compile time. At runtime, Nest can see that there is a `GET /books/:id` route with an `id` path parameter, and it can read the class metadata TypeScript emits for decorated members. It cannot see that the method returns a `Book`, and it cannot see which properties `Book` has unless something records them.

There are two ways to record them: decorators you write by hand, or the CLI plugin that writes them for you at compile time. You will likely use both.

### Decorators by hand

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class Book {
  @ApiProperty({ description: 'Unique identifier', example: 'bk_123' })
  id: string

  @ApiProperty({ maxLength: 200, example: 'Dune' })
  title: string

  @ApiPropertyOptional({ example: 'Book one' })
  subtitle?: string
}
```

DTOs must be classes, not interfaces or type aliases, for any of this to work.

### The CLI plugin

The [Swagger CLI plugin](https://docs.nestjs.com/openapi/cli-plugin) is a TypeScript transformer that reads your types during compilation and adds the metadata for you. Enable it in `nest-cli.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ]
  }
}
```

With the plugin on, every property in a file ending in `.dto.ts` or `.entity.ts` is documented as if it had `@ApiProperty()`, including whether it is optional, its type, and its default value. `classValidatorShim` turns `class-validator` decorators such as `@MaxLength(200)` into schema constraints. `introspectComments` turns JSDoc comments on properties into descriptions and examples, so you do not write every description twice.

Two things trip people up:

- **File naming.** The plugin only processes files matching `dtoFileNameSuffix` (default `['.dto.ts', '.entity.ts']`) and `controllerFileNameSuffix` (default `['.controller.ts']`). A DTO in `book.ts` is silently skipped. Rename it or change the option.
- **Other builders.** The plugin runs as part of the Nest CLI's TypeScript compilation. With SWC, the docs recommend `nest start -b swc --type-check`, and monorepos need a metadata generation step plus `SwaggerModule.loadPluginMetadata()`. With other build tools, check the plugin page before assuming it ran.

## Describe responses explicitly

Even with the plugin, Nest does not know what a handler returns. Say so:

```ts
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'

@ApiTags('books')
@Controller('books')
export class BooksController {
  @Get(':id')
  @ApiOperation({ summary: 'Get a book' })
  @ApiOkResponse({ type: Book, description: 'The requested book' })
  @ApiNotFoundResponse({ description: 'No book with that ID' })
  findOne(@Param('id') id: string): Promise<Book> {
    return this.booksService.findOne(id)
  }
}
```

There is a shorthand decorator for every common status (`@ApiCreatedResponse`, `@ApiForbiddenResponse`, and so on), all built on `@ApiResponse({ status, ... })`. For arrays, use `@ApiOkResponse({ type: Book, isArray: true })` or `type: [Book]`.

This is the most common gap in NestJS documents: the happy path is documented, and the `404` thrown by `NotFoundException` in the service is not. Every tool downstream then believes the endpoint cannot fail.

## Make operation IDs stable

Each operation gets an `operationId`. By default `@nestjs/swagger` builds it as `{ControllerName}_{methodName}`, so the handler above becomes `BooksController_findOne`. That is unique and stable as long as you do not rename classes, but it is not what you want as a method name in a generated SDK.

SDK generators name methods after operation IDs, and renaming one later is a breaking change for anyone using the client. Decide the scheme now with `operationIdFactory`:

```ts
const documentFactory = () =>
  SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  })
```

Using only `methodKey` requires method names to be unique across controllers. If they are not (every controller has a `findOne`), keep the controller in the ID but drop the `Controller` suffix, or set IDs per route with `@ApiOperation({ operationId: 'getBook' })`.

## Authentication

Declare the security schemes on the document, then attach them to controllers or handlers:

```ts
const config = new DocumentBuilder()
  .setTitle('Bookstore API')
  .setVersion('1.0.0')
  .addBearerAuth()
  .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
  .build()
```

```ts
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {}
```

Your guards still enforce authentication at runtime. The decorators only describe it, and Nest does not check that the two agree. When they drift, documentation UIs show the wrong auth form and generated clients ask for the wrong credentials. A test that compares guarded routes with the document's security requirements is worth writing if you have many of them.

## Mapped types: import from the right package

Nest's mapped types (`PartialType`, `PickType`, `OmitType`, `IntersectionType`) are how most apps derive update and create DTOs:

```ts
import { PartialType } from '@nestjs/swagger'

export class UpdateBookDto extends PartialType(CreateBookDto) {}
```

Import them from `@nestjs/swagger`, not from `@nestjs/mapped-types`. Both work at runtime, but only the `@nestjs/swagger` versions carry the OpenAPI metadata across, so the other import produces an update DTO with no properties in the document. It is the single most common "why is my schema empty" answer.

## Enums, generics and extra models

**Enums.** Give them a name so they become a reusable schema instead of an inline list repeated everywhere:

```ts
@ApiProperty({ enum: BookFormat, enumName: 'BookFormat' })
format: BookFormat
```

**Generic responses.** TypeScript generics are erased, so a `Paginated<Book>` wrapper cannot be discovered. Register the inner model with `@ApiExtraModels(Book)` and compose the response with `allOf` and `getSchemaPath(Book)`. The [operations page](https://docs.nestjs.com/openapi/operations) has a complete example, including a reusable `ApiPaginatedResponse` decorator. Wrap it once and reuse it.

**Hiding things.** `@ApiExcludeEndpoint()` and `@ApiExcludeController()` remove routes from the document. `@ApiHideProperty()` removes a property, which you need when the CLI plugin would otherwise document an internal field.

## Export the document for CI

The served document is fine for development. For CI you want a file: something you can lint, diff against the last release, commit, and hand to other tools. The simplest approach is a small script that builds the app without listening:

```ts
// scripts/export-openapi.ts
import { writeFileSync } from 'node:fs'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from '../src/app.module'

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false })
  const config = new DocumentBuilder().setTitle('Bookstore API').setVersion('1.0.0').build()
  const document = SwaggerModule.createDocument(app, config)
  writeFileSync('openapi.json', JSON.stringify(document, null, 2))
  await app.close()
}
main()
```

Keep the `DocumentBuilder` configuration in one shared function so `main.ts` and this script cannot drift. If your modules connect to a database on startup, you will need to stub those providers or use a test module here. Then lint the file in CI (our [Spectral rules guide](/learn/openapi/spectral-rules) has a starting ruleset) and compare it with the previous release to catch breaking changes.

## Common mistakes

- **Interfaces as DTOs.** They vanish at runtime. Use classes.
- **DTO files without the `.dto.ts` suffix** when relying on the CLI plugin.
- **Mapped types from `@nestjs/mapped-types`.** The derived DTO shows up empty.
- **No response decorators.** Return types are invisible to Nest, so the document has no response schema.
- **Default operation IDs in a public SDK.** `BooksController_findOne` becomes a method name.
- **Auth decorators that disagree with guards.** Nothing checks them against each other.

## What to do with the document

Now you have an accurate OpenAPI document coming out of your app and your CI. The value is in what reads it:

- **A documentation UI.** `@nestjs/swagger` serves Swagger UI. Set `ui: false` and you can serve any other UI that reads OpenAPI from the same JSON route.
- **Client SDKs** for the languages your users write, generated from the document instead of maintained by hand.
- **An MCP server** so AI agents can call the operations you choose.
- **Contract tests and breaking-change checks** against the last published document.

Part two of this series covers each of those. If you want the short version today, the [NestJS API documentation](/docs-for/nestjs) page shows the setup, and the [NestJS integration guide](/products/api-references/integrations/nestjs) lists every option.

## Frequently asked questions

<scalar-detail title="Where is the NestJS OpenAPI JSON document?">
If you call `SwaggerModule.setup('api', ...)`, the JSON is at `/api-json` and YAML at `/api-yaml`. Change them with the `jsonDocumentUrl` and `yamlDocumentUrl` options.
</scalar-detail>

<scalar-detail title="Is @nestjs/swagger OpenAPI or Swagger?">
It generates an OpenAPI 3.x document. The package name and the bundled Swagger UI keep the older "Swagger" name.
</scalar-detail>

<scalar-detail title="Why are my NestJS DTO properties missing from the schema?">
Usually one of three things: the DTO is an interface rather than a class, the file does not end in `.dto.ts` or `.entity.ts` while you rely on the CLI plugin, or a mapped type was imported from `@nestjs/mapped-types` instead of `@nestjs/swagger`.
</scalar-detail>

<scalar-detail title="How do I change operation IDs in NestJS?">
Pass `operationIdFactory` in the options to `SwaggerModule.createDocument`, or set `operationId` in `@ApiOperation()` on a single handler.
</scalar-detail>

<scalar-detail title="Can I serve the OpenAPI document without Swagger UI?">
Yes. Pass `{ ui: false }` as the options to `SwaggerModule.setup` and only the document routes are served.
</scalar-detail>

<scalar-detail title="Which OpenAPI version does NestJS generate?">
The document declares OpenAPI 3.0.0 by default. `DocumentBuilder.setOpenAPIVersion()` changes the declared version; validate the output against that version before relying on it.
</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger)
- **Docs:** [NestJS integration guide](/products/api-references/integrations/nestjs)
- **Product:** [NestJS API documentation](/docs-for/nestjs) — turn the document from this post into interactive docs with one package
