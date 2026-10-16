# Scalar SDK Generator release notes

<!--
  Rendered from the SDK generator's release notes on every release. Edits
  made here will be overwritten - change the release notes at the source
  instead.
-->

Curated release notes for the Scalar SDK Generator. Each entry summarizes what shipped across every target language in that release.

## 0.36.7 (2026-10-16)

### Operations can now route to their own server URLs

This release adds support for operations that declare their own server URLs in the OpenAPI document. Generated SDKs now send these operations to their declared hosts instead of the client base URL, while preserving environment selection and proxy support. The C++ target gets async clients, streaming, webhooks, and code samples.

- Operations with their own `servers` configuration now route to those hosts across all targets (TypeScript, C#, Go, Java, Kotlin, PHP, Python, Ruby, Rust, Swift), letting SDKs work with APIs that host different endpoints on different domains.
- C++ SDKs now generate an async client with methods that return futures or accept callbacks, alongside streaming support for Server-Sent Events and JSON Lines responses.
- C++ SDKs verify and decode webhook deliveries with Standard Webhooks signature schemes, plus ship code samples, a smoke harness, and build much faster on large APIs.
- Enum members renamed through `x-stainless-renameMap` or `x-fern-enum` now use those names in C#, Java, Kotlin, PHP and Ruby instead of deriving names from wire values.
- Generated documentation improvements include operation-specific API reference sections, better deprecation messages from `x-stainless-deprecation-message`, and repository links in package READMEs.

## 0.36.6 (2026-10-15)

### Expanded C++ and Dart SDKs, refined authentication and pagination

This release brings substantial progress to the experimental C++ and Dart targets, with generated clients, models and runtime components now available. C# SDKs receive refinements to union naming, credential handling and code samples, while TypeScript SDKs gain server variable options and bigint support for 64-bit integers.

- C++ SDKs now generate a complete client over libcurl with typed models, paginated operations and credential support.
- Dart SDKs now ship a client, models, resources, pagination, webhook helpers and formatted code samples.
- C# union arms that extend a component now take descriptive names such as `ThingNodeWithType` instead of positional ones.
- TypeScript SDKs accept client options for server variables, so a tenant in the host is set with `new Client({ site: 'acme' })` instead of a hand-built `baseURL`.
- Webhook helpers configured with `webhookKeyOpt: false` no longer emit signature verification when no verifying helper shares their events.

## 0.36.5 (2026-10-09)

### OAuth token revocation, resource indicators, and query parameter fixes

This release adds OAuth token revocation when signing out of generated CLIs, introduces resource indicators for requesting API-specific tokens, and fixes query parameter serialization in Java and Kotlin SDKs.

- Generated CLIs now revoke OAuth tokens at the provider when you sign out, using the RFC 7009 endpoint set in `targets.cli.credentialStore.oauth.revocationUrl` or discovered from OpenID Connect metadata.
- Generated CLIs and Rust SDKs can now request OAuth tokens for a specific API, sending `openapi.securitySchemeSettings.<scheme>.resource` and `audience` on every token request.
- Java and Kotlin SDKs now follow OpenAPI `explode` for query parameters when `querySettings.arrayFormat` is not set, repeating keys instead of comma-joining them.
- Ruby SDKs now spell boolean and numeric enum members as their JSON types instead of symbols, so `true`, `false`, integers, and floats are sent correctly.
- Kotlin and Java SDKs publishing to Maven Central now release uploads automatically instead of waiting for manual approval in the Central Portal.

## 0.36.4 (2026-10-09)

### Per-target skip settings now isolate each SDK, and Java, Kotlin, and Ruby are stable

This release applies per-target `only` and `skip` settings to each SDK on its own, so skipping operations or models for one target no longer affects the others. Java, Kotlin, and Ruby are also promoted to stable targets.

- Per-target `only` and `skip` settings now apply to each target independently, so a resource or method skipped for one target does not appear in that SDK even when another target keeps it.
- A resource skipped for a target also drops its methods, subresources, and the models declared under it, for that target only.
- `only` and `skip` on webhook unwrap helpers and streaming overloads are now honored whether you generate one target or several.
- Code samples follow the same per-language settings, and every target now honors document-level per-target skip lists on union variants and object properties.
- Generating several targets at once stays fast, because targets with the same `only` and `skip` settings share a single compile.
- Java, Kotlin, and Ruby are now stable targets: `list-targets` reports them as stable, and their configuration reference pages no longer carry the experimental note.

## 0.36.3 (2026-10-05)

### Python item-cursor pagination types

Python SDKs with item-cursor pagination now declare a protocol for cursor items, so imports and type checking work correctly.

- `from <package>.pagination import CursorPageItem` now resolves to a runtime-checkable `Protocol`, and paging behaves exactly as before.

## 0.36.2 (2026-10-05)

### README type accuracy, Python union fixes, and Go and Ruby naming fixes

This release improves README documentation accuracy across all target languages, fixes several Python SDK bugs related to union types and recursive structures, and corrects Go union routing and Ruby attribute naming.

- README authentication and client options tables now show the exact types each language declares, so they match what you see in your generated SDK.
- Python SDKs no longer silently drop wire aliases and date formatting inside recursive request unions.
- Python union response variants that extend a model now subclass it instead of duplicating all of its fields.
- Go discriminated unions now route by discriminator only when each variant has a unique value, preventing incorrect decoding.
- Ruby attributes that shadow built-in methods now take a trailing underscore to avoid conflicts.

## 0.36.1 (2026-10-02)

### Keychain support for CLI credentials, aliases for renamed types, and Go identifier fixes

This release improves credential management on macOS, adds aliases for renamed types in TypeScript and Python, and fixes Go identifier formatting issues.

- Generated CLIs now store credentials in the macOS Keychain through the system `security` utility, which works for both npm and standalone binary installs.
- TypeScript SDKs now support type aliases through `backCompat.typeAliases`, keeping legacy type names and imports working after types are renamed or nested.
- Python SDKs now support import path aliases, so existing imports keep working when types move or are renamed, with optional deprecation messages.
- Go SDKs now handle nested model types in request parameters correctly and format identifier segments like `sla` as `Sla` instead of `SLA`.
- Python request serialization now resolves forward-referenced union members, fixing runtime errors when sending requests with recursive union types.

## 0.36.0 (2026-09-30)

### Generated code checks, CLI environment selection, and Go pagination pages

This release checks generated Go code before writing it, fixes CLI credential routing across environments, and generates page types for Go pagination. C++ webhook signature verification now works correctly, and several type inference fixes improve Go SDK quality.

- The generator now checks Go code samples before writing them, and a sample that assigns a value of the wrong type to a struct field is withheld and reported as `Target/InvalidGeneratedCode`.
- Generated CLIs now match stored credentials to the selected environment: `login` and `logout` accept `--environment`, and the CLI reads a new `<PREFIX>_ENVIRONMENT` variable.
- Go SDKs now generate page types for page-number and offset pagination, with `GetNextPage` and `AutoPaging` methods that handle totals and empty pages correctly.
- C++ webhook signature verification now implements the Standard Webhooks HMAC scheme correctly, with constant-time comparison and timestamp tolerance checks.
- TypeScript SDKs no longer shadow globals like `Response` or `FormData` in `client.ts`, and Go request enums are typed correctly when fields reference the same component.

## 0.35.2 (2026-09-28)

### Homebrew cask publishing

This release adds support for publishing generated CLIs as Homebrew casks.

- Generated CLIs can now be published to Homebrew as casks with `targets.cli.publish.homebrew.cask: true`, with support for macOS notarization and shell completions.
- `replaceFormula: true` migrates users from a Homebrew formula to the cask automatically, with tap migration support.
- Generated Homebrew packages now pass `brew audit --strict` and `brew style`.
- Install commands for third-party Homebrew taps now use fully qualified names to avoid conflicts with official packages.

## 0.35.1 (2026-09-28)

### macOS binary signing and credential fallback for generated CLIs

This release adds code signing support for macOS CLI binaries and accepts publishing credentials under standard secret names used by other generators, making setup easier for repositories that already have those secrets configured.

- Generated CLIs can now sign macOS binaries with a Developer ID certificate and optionally notarize them, so they run on Apple Silicon without Gatekeeper warnings.
- Release workflows accept publishing credentials under common secret names used by other generators as fallbacks, so repositories with existing PyPI, RubyGems, Homebrew, or Maven Central secrets publish without adding new ones.
- macOS signing runs on Linux release runners, and signing credentials are checked before anything is compiled or published to npm.

## 0.35.0 (2026-09-26)

### Configure your integration branch and control how CLI commands nest

You can now name the branch where generated code is merged with custom work, choose how CLI subresources appear in help text and completions, and migrate a Homebrew tap from a cask to a formula without leaving two copies installed.

- `destinations.production.integrationBranch` sets the branch that receives generated releases and versioning commits (defaults to `scalar-next`).
- `targets.cli.subresourceSeparator` chooses between `colon` (`projects:tasks create`) and `space` (`projects tasks create`) in generated CLIs.
- `publish.homebrew.pullRequest` opens a pull request against protected taps instead of pushing directly.
- `publish.homebrew.replaceCask` migrates users from a cask to a formula automatically when the cask installs the same CLI command.
- Go SDKs now name discriminated union arms and request constructors after their tags, and order response fields consistently.
- Generated Swift SDKs now include a test executable that calls every operation against a mock server and writes a JSON report, as the other targets do.

## 0.34.0 (2026-09-24)

### Fern project detection and SDK variables support

This release reads Fern-annotated documents automatically and adds support for `x-fern-sdk-variables`, which moves common path parameters like workspace or project IDs from method arguments to client constructor options. Generation is also much faster for large APIs, and the augmented OpenAPI document gains Swift code samples.

- Fern-annotated OpenAPI documents are now read the Fern way when no config exists, deriving a starter configuration from `x-fern-*` extensions for grouping, method names, pagination, and more.
- Path parameters marked with `x-fern-sdk-variable` become client constructor options in TypeScript, Python, Java, Kotlin, and CLI targets, simplifying method signatures for multi-tenant APIs.
- Generation of large SDKs is now much faster, especially for C# and Go.
- SDK code samples are now generated for each named example in the request body, linked by example name and content type for the API reference example switcher.
- Swift code samples are now added to the augmented OpenAPI document, with typed arguments, pagination, and streaming operations.

## 0.33.5 (2026-09-23)

### Better error messages and Go SDK improvements

This release improves error messages for unresolvable references, improves Go SDK generation, and lets CLI sign-in pages show your organization's logo.

- Reference resolution errors now explain what went wrong and where, instead of surfacing raw errors.
- Go SDKs now honor per-target skip settings.
- CLI sign-in pages can show a custom organization logo set with `organization.logo`.
- Go SDKs generated with the `v2` code style now place parent path parameters in the params struct instead of taking them positionally.
- The Swift generator was rebuilt from scratch, with improved models, enums, and union handling.

## 0.33.4 (2026-09-22)

### Swift formatting, Go union fixes, Python circular import guards, and CLI environment picker

This release formats Swift SDKs automatically with a WebAssembly build of swift-format, fixes Go union declarations and name collisions, guards Python type re-exports against circular imports, and adds an environment picker to generated CLIs.

- Generated Swift SDKs are now formatted with a pinned WebAssembly build of swift-format, so no Swift toolchain is needed on the host machine.
- Swift SDKs now support macOS 12 and iOS 15, and names that collide after escaping no longer produce duplicate declarations.
- Go SDKs now declare component `oneOf` unions that no resource configures, fixing compilation errors.
- Python type package indexes now defer re-exports that would cause a circular import, and forward references now resolve through the full dotted module path.
- Generated CLIs for APIs with multiple environments now support a global `--environment` flag with shell completions and a new `environments` command.

## 0.33.3 (2026-09-20)

### Credential redaction in TypeScript request logs

This release makes TypeScript request logging safe for APIs whose credentials use their own header or query parameter names.

- TypeScript request logs now redact the credential headers and query parameters your API description names, not only a fixed list of common header names.

## 0.33.2 (2026-09-18)

### Credential stores, OAuth improvements, and multi-scheme authentication

This release stores generated CLI credentials in the operating system's credential store, improves OAuth flows, fixes SDKs for APIs that offer several authentication options, and reports unsupported OpenAPI operations instead of omitting them.

- Generated CLIs now store credentials in your operating system's native credential store (Secret Service on Linux, Credential Manager on Windows), falling back to a permission-restricted file when no store is available.
- OAuth flows gained device authorization support, better refresh token handling, and a styled callback page for browser-based sign-ins.
- Schema metadata such as defaults, examples, extensions, and `readOnly` flags written beside a `$ref` is now preserved.
- Unsupported OpenAPI operations (`QUERY`, `CONNECT`, custom methods) and `querystring` parameters are now reported with their source locations instead of being silently omitted.
- SDKs for APIs that offer several authentication alternatives no longer demand every credential at once.
- Generated workflows now use GitHub Actions versions that run on Node.js 24 and configure Gradle cache settings for private repositories.
- Java and Kotlin code samples now show documented enum defaults instead of always showing the first enum member.

## 0.33.1 (2026-09-17)

### Nullable references preserve metadata and improved CLI reliability

This release fixes how nullable references handle documentation and defaults, resolves CLI command collisions, and validates repository configuration before it reaches generated code.

- Nullable references now preserve property documentation, defaults, and naming metadata while reusing shared models.
- CLI commands no longer send path parameters twice when used positionally.
- Reserved CLI flag names like `--help` are now handled correctly, with `--version` available for body fields.
- Repository configuration is validated before generation, preventing shell injection risks in install commands.
- Client-level options can now be marked overridable, allowing per-request overrides of default values.

## 0.33.0 (2026-09-15)

### Warn when re-derived placement breaks public API

Adding operations can silently move methods to new subresources when the SDK structure is derived from the OpenAPI document. This release warns when public accessors change or disappear.

- Generation now warns when re-deriving resource placement renames or removes public methods, helping you catch breaking changes before you publish.
- CLI error messages no longer mention SDK constructor APIs that command-line users cannot use.
- TypeScript SDKs can now type `format: date-time` fields as JavaScript `Date` objects with `targets.typescript.options.dateTimeType: 'Date'`.
- Documents can now declare pagination schemes, response unwrapping, and client settings directly through extensions like `x-scalar-pagination` and `x-scalar-sdk-settings`.

## 0.32.14 (2026-09-14)

### Improved streaming support and model naming across languages

This release brings clearer streaming implementations across all targets, with dedicated decoders for JSON Lines responses and improved type safety. It also fixes a bug where generated types could shadow language built-in generics and break compilation.

- Models named after language generics (like `Array`, `List`, and `Record`) no longer shadow built-in types and break compilation.
- TypeScript, Python, C#, Go, Ruby, PHP, and Kotlin SDKs now have dedicated JSON Lines stream decoders instead of sharing the SSE handler.
- Go SDKs using the `v2` code style now support response unions that mix scalar and composite types, with flattened struct representations.
- TypeScript non-string header parameters are now stringified, fixing compilation errors for boolean and numeric headers.
- C# SDKs now stream newline-delimited JSON responses through `Core/Jsonl.cs`.

## 0.32.13 (2026-09-11)

### Clearer error class names in TypeScript SDKs

Generated TypeScript SDKs now report distinct error class names for better debugging and log grouping.

- TypeScript error classes now report their actual names instead of a generic `Error`, making debugging and error tracking easier.

## 0.32.12 (2026-09-11)

### Improved package registry linking and target stability in the config schema

This release improves how the SDK generator links to package registries across platforms, fixes PHP package name resolution, and records each target's stability in the config schema.

- Package registry URLs now support platform-specific addressing, including Maven Central artifacts, Go modules, and GitHub release binaries.
- PHP package name resolution now prefers Composer package names over internal namespace identifiers.
- The config schema now records each target's stability: in this release TypeScript, Python, Go, and CLI were marked stable and the other targets experimental.

## 0.32.10 (2026-09-11)

### Improved streaming responses, CLI documentation, and Go SDK generation

This release improves content negotiation for streaming responses across all targets, adds command group descriptions to generated CLI tools, and fixes several Go SDK generation issues, including WebSocket support and response type handling.

- Streaming responses now send the correct `Accept` header based on the API's declared media type instead of a hardcoded value.
- Generated CLI tools now display resource descriptions in command group listings, making help output more informative.
- Long CLI command samples wrap across multiple lines for better readability in documentation and man pages.
- Go SDKs now handle WebSocket channels and non-JSON response bodies like zip archives.

## 0.32.9 (2026-09-10)

### Go SDK v2 code style support and prerelease channel configuration

This release adds support for generating Go SDKs in the newer `v2` code style through `targets.go.options.codeStyle`. It also declares prerelease channels in the configuration schema for every package-publishing target.

- Go SDKs can now be generated in the `v2` code style by setting `targets.go.options.codeStyle` to `"v2"`, which uses `param.Opt` optionals and dedicated union types.
- Prerelease channels are now declared in the configuration schema for all targets that publish packages.
- Go request unions are now supported in the `v2` code style.
- The default Go code style is unchanged, so existing SDKs keep generating identical output.

## 0.32.8 (2026-09-09)

### Improved Go SDK generation

This release improves Go code samples and header handling for both Go code styles.

- Go code samples now match the code style being generated, with full support for `v2` params structs and nullable fields.
- Go header and cookie parameters are now guarded and unwrapped according to the code style, with correct handling of optional and required fields.

## 0.32.7 (2026-09-09)

### Faster SDK generation and improved config handling

This release brings substantial performance improvements to SDK generation across all target languages, with large OpenAPI documents generating noticeably faster. The release also fixes several language-specific issues.

- SDK generation is now significantly faster for all languages, with Go seeing the largest improvement.
- TypeScript generation is faster too, and its output is unchanged.
- C# SDKs now return the raw HTTP response for non-JSON binary content instead of trying to deserialize it as JSON.
- Java and Kotlin SDKs now handle query parameters in path segments and nested class references in code samples correctly.

## 0.32.6 (2026-09-08)

### Ruby gemspec metadata fix

This release fixes Ruby SDK metadata so generated gemspecs link to the repository correctly.

- Generated Ruby gemspecs now strip branch suffixes from repository URLs.

## 0.32.5 (2026-09-08)

### CLI file uploads and Java and Kotlin compilation fixes

This release fixes file uploads in generated CLIs and compilation of generated Java and Kotlin SDKs, and standardizes package install commands in augmented OpenAPI documents.

- Generated CLIs now upload file contents instead of sending path strings, using curl-style syntax like `@file.pdf` or `--document @openapi.json`.
- Generated Java and Kotlin SDKs now compile, fixing conflicts with reserved method names and null handling in builders.
- Package install commands in augmented OpenAPI documents now use standard templates for npm and PyPI.

## 0.32.4 (2026-09-08)

### Publishing configuration improvements and package identifier fixes

This release documents each publishing registry's setup in the configuration schema, adds options for npm package visibility and dist-tags, and fixes several package identifier bugs across Go, Swift, and other languages.

- Setup instructions for each publishing registry are now documented in the configuration schema, with OIDC and token authentication steps.
- TypeScript SDKs can now set npm package visibility with `publish.npm.access` and choose the dist-tag stable releases use with `publish.npm.tag`.
- Go package identifiers now default to the configured client name instead of a long API slug, producing more readable package declarations.
- Swift package identifiers no longer change when you regenerate an existing SDK, so published packages are not accidentally renamed.
- Ruby targets using the legacy `publish.gem` key are migrated to `publish.rubygems` automatically on load, preventing silent publishing failures.

## 0.32.3 (2026-09-06)

### Speakeasy pagination import and unified code samples

This release imports Speakeasy pagination configuration and unifies how code samples are generated across all target languages. SDKs generated from imported Speakeasy projects now include pagination helpers, and code samples show consistent, realistic request data in every language.

- Speakeasy pagination extensions are now mapped to Scalar pagination schemes when importing a `gen.yaml`, so list endpoints in imported projects get typed page helpers.
- Code samples now show the same request data for an operation in every language, with arrays filled and constraints like `minItems` honored consistently.
- C# SDKs now send configured default headers from the client instead of declaring a member for them, so client-wide headers apply to every request.
- Generated CLIs now coerce repeatable flag values by their item schema, so empty strings stay empty and integers parse as numbers instead of becoming `null`.

## 0.32.2 (2026-09-04)

### Improved Fern project support

This release supports more Fern OpenAPI extensions, so projects using Fern's audience filtering, custom naming, and SDK variables generate correctly.

- Fern projects now respect audience filtering through `x-fern-audiences`, converting excluded endpoints and properties to the equivalent Scalar configuration.
- Fern naming extensions (`x-fern-type-name`, `x-fern-property-name`, `x-fern-enum`) are now read alongside `x-scalar-*` markers and behave identically.
- Fern projects declaring both Node and browser TypeScript generators now get one client that runs in both environments.

## 0.32.1 (2026-09-03)

### Better validation, pagination fixes, and improved SDK quality across all targets

This release improves how generated SDKs handle numeric constraints, cursor-based pagination, and request bodies. Code samples now respect bounds declared in your OpenAPI documents, pagination advances on the correct parameters, and several targets gained fixes for text responses, binary uploads, and type retention.

- Code samples now honor numeric bounds like `minimum`, `maximum`, and their exclusive variants, producing realistic values that respect your schema constraints.
- Cursor pagination now advances on the parameter your API declares instead of inventing one, fixing compilation errors in Kotlin and runtime failures in C#.
- Generated C# SDKs can now call operations with binary request bodies and advance `cursor_id` pages from the last row's cursor.
- Python SDK generation is significantly faster on documents with shared request models, and all imported types are now kept.
- Rust SDKs serialize integer-valued numbers without decimal points and parse date-time fields leniently to handle real-world timestamp formats.

## 0.32.0 (2026-08-29)

### Ruby trusted publishing

This release makes trusted publishing the default for Ruby SDKs.

- Ruby SDKs now publish to RubyGems with trusted publishing (OIDC) by default, so destination repositories no longer need to store long-lived API keys.

## 0.31.1 (2026-08-28)

### npm publishing fix for generated CLIs

This release fixes npm publishing for generated CLIs.

- Generated CLIs now include the repository metadata npm needs for provenance-signed releases.

## 0.31.0 (2026-08-28)

### Speakeasy import improvements, faster Go and Ruby generation, and CLI package naming

This release improves importing Speakeasy projects and speeds up Go and Ruby generation for large documents. CLI package naming now uses more readable kebab-case by default.

- Imported Speakeasy projects now read `x-speakeasy-name-override` and `x-speakeasy-globals` automatically.
- CLI packages now use kebab-case names (for example `scalar-galaxy-cli` instead of `scalargalaxy-cli`), which `targets.cli.packageName` can override.
- Go SDK generation is significantly faster for large documents, and Go SDKs now compile correctly with union references.
- Ruby formatting now runs in parallel across worker threads, speeding up generation for large SDKs.

## 0.30.1 (2026-08-27)

### Naming overrides, enum flattening, and type declaration fixes

This release supports vendor naming extensions in more schema positions, merges inline string enum unions into single enums, and fixes several target-specific bugs where declarations were missing or colliding.

- `x-stainless-naming` overrides are now honored on component schemas and parameters, not just properties.
- Inline string enum unions are now flattened into single enums in Go, Rust, Ruby, C#, Java, and Kotlin.
- `x-stainless-param` and `x-stainless-renameMap` are now respected for parameter and enum member names.
- C# SDKs now skip duplicate constructors and name array element types after their component types.
- Go modules now declare every referenced type, so generated code compiles without missing identifiers.

## 0.30.0 (2026-08-25)

### Improved formatting resilience and pagination cursor handling

This release fixes formatting of large Java and Kotlin files, pagination cursor extraction, and parameter name collisions across several languages.

- Kotlin and Java SDKs no longer fail to format when a large file exceeds formatter limits: the SDK is generated in full, and the files left unformatted are reported.
- Pagination now follows cursors nested inside envelope fields, so APIs that return cursors like `links.next` fetch every page in Python and TypeScript.
- Parameters with similar names like `status` and `status[]` no longer conflict in Python, Ruby, Rust, and other languages.
- C# namespaces are now fully qualified when nested resources share names with top-level resources, preventing ambiguous reference errors.
- PHP page metadata fields with object shapes are now declared as models instead of strings, so their nested properties are accessible.

## 0.29.0 (2026-08-24)

### Generated SDK tests now exercise optional parameters

The tests generated with each SDK call every operation against a mock server. Previously they passed only required parameters, leaving optional query parameters, headers, and nested body fields unexercised. Each operation with optional arguments is now called twice: once with required parameters only, and once with every parameter filled.

- Each operation now gets up to two test cases: a minimal call with required parameters, and a full call that fills every optional argument the signature accepts.
- Test reports label each case as `required params` or `all params`, so a failure shows which call broke.
- Go, Python, and Kotlin code samples that fill optional fields now generate valid code.
- Documentation samples (README, docstrings, augmented OpenAPI) keep their minimal shape, so guides stay focused on the simplest working call.
- Go SDKs no longer overflow the stack or loop forever on schemas that reference themselves.

## 0.28.0 (2026-08-21)

### AsyncAPI support and refined example rendering

This release extends imported vendor configurations to AsyncAPI documents and improves how configured examples appear across all generated SDKs.

- Imported Fern and Speakeasy configurations now derive their resource tree from AsyncAPI documents, enabling full WebSocket client generation.
- README examples now respect `readme.exampleRequests` in every target, opening with the operation you specify rather than the first one alphabetically.
- Generated Python, Go, C#, Java, and Kotlin samples now render configured parameter values exactly as written and print the response property you choose.
- Rust SDKs now get properly named sub-clients and request builders without model name collisions, box recursive union variants so they compile, and escape crate names that start with digits.

## 0.27.3 (2026-08-21)

### Code sample formatting and README customization

This release adds formatting for generated Kotlin and Java code samples, makes README configuration take effect in every target, and improves how generated CLIs and SDKs document their usage examples.

- Kotlin and Java code samples are now formatted with ktfmt and google-java-format at generation time, so snippets copied from documentation match the SDK's own code style.
- README headings and generator attribution can now be customized through the `readme` config block in every supported language.
- CLI READMEs now render usage examples from your configured example requests instead of sampling from the OpenAPI document, showing exactly the commands and arguments you choose.
- Generated TypeScript is now formatted with Biome's WebAssembly build instead of the Biome CLI, so formatting no longer depends on the host platform.
- Code sample formatters now start before any sample is built, so formatters that load asynchronously no longer leave samples unformatted.

## 0.27.2 (2026-08-20)

### WebAssembly rustfmt, least-privilege workflows, and security policies

Rust SDK generation no longer needs a Rust toolchain, generated GitHub workflows ask for only the permissions they use, and every SDK ships a security policy.

- Rust SDK generation no longer requires an installed Rust toolchain, using WebAssembly-compiled rustfmt instead.
- Generated GitHub workflows now declare least-privilege token permissions.
- Every target now ships a `SECURITY.md` file that clearly separates SDK and API vulnerability reporting.

## 0.27.1 (2026-08-18)

### Better documentation and improved packaging

This release improves SDK documentation across several targets, including real javadoc jars, dependency coordinates, and resource descriptions.

- Java and Kotlin SDKs now ship real API documentation in their javadoc jars instead of the empty artifacts previously published to Maven Central.
- Java and Kotlin READMEs now include copy-and-paste dependency coordinates for Gradle and Maven, not only build-from-source instructions.
- Generated resources are now documented with the OpenAPI tag descriptions their operations carry, filling in service class documentation that was previously missing.
- Per-operation request timeouts are now respected in Java, Kotlin, TypeScript, and Python SDKs, so endpoints configured as slow no longer time out early.

## 0.27.0 (2026-08-17)

### Connect protocol support and proto diagnostics

This release adds Connect RPC support for unary and server-streaming calls to TypeScript SDKs and improves diagnostics for proto inputs. Connect calls now send the correct protocol headers and decode error envelopes, while server-streaming calls decode frames into the same `Stream` interface as SSE methods. SDKs generated from proto files gain detailed diagnostics for unsupported features and configuration issues, with fixes that point at the declaring `.proto` file.

- TypeScript SDKs generated from proto files now make working Connect calls, with the correct protocol headers, error handling, and server streaming.
- Eight new diagnostics for proto inputs report problems such as query format mismatches and service placement issues, pointing at the `.proto` file and offering safe fixes.
- Generated SDKs now ship a `.gitignore` file that keeps build output out of the repository from the first run.
- Java and Kotlin SDKs gained async pagination, `Optional` returns from core APIs, and corrected enum constant naming.

## 0.26.0 (2026-08-14)

### Generate SDKs from Protocol Buffers

You can now generate typed SDKs from gRPC services defined in Protocol Buffers. Point the generator at a compiled descriptor set or a directory of proto files, and it will produce SDKs with message models and client scaffolding in every language, and RPC methods wherever the target can send them.

- SDKs can now be generated from protobuf inputs, either descriptor sets or proto directories, alongside OpenAPI and AsyncAPI documents.
- RPCs with `google.api.http` annotations become REST endpoints, so they can be called over HTTP without a Connect runtime.
- Proto inputs without a config now derive a starter config from the descriptor set, naming the SDK after the proto package.
- Java and Kotlin SDKs now type `format: byte` fields as `String` instead of `ByteArray`, fixing base64 text handling.
- Python SDKs now model `allOf` compositions as subclasses, import models correctly in union variants, and generate accurate client method signatures.

## 0.25.1 (2026-08-14)

### Improved naming across targets

This release improves naming consistency across Java, Kotlin, Python, and TypeScript SDKs.

- TypeScript, Java, and Kotlin SDKs now require the request body parameter when the payload cannot accept an empty object.
- Java and Kotlin class names now honor custom type names from extensions and keep component titles for union arms.
- Python array element models now use component names instead of numeric suffixes.
- Java and Kotlin SDKs no longer declare unused type aliases for scalar components that produce no class.

## 0.25.0 (2026-08-13)

### AsyncAPI support and new diagnostics rules

This release accepts AsyncAPI 3.x documents alongside OpenAPI, generating SDKs from AsyncAPI channels served over HTTP and WebSocket. Diagnostics now apply only to the document types they are written for, and AsyncAPI findings each get their own rule and documentation page.

- AsyncAPI 3.x documents are now accepted, and channels become streaming methods where the target's runtime supports them.
- AsyncAPI channels served over `http` or `https` become streaming methods with the same framing OpenAPI operations use: `text/event-stream` as SSE and NDJSON as JSON Lines.
- Diagnostics now apply only to the document types they are written for, so OpenAPI-specific diagnostics no longer report findings on AsyncAPI documents.
- Twelve AsyncAPI diagnostics now have dedicated rules and documentation pages, covering protocol support, supported schema formats, and channel configuration issues.
- Generated Python SDKs now install in editable mode with `pip install -e`, fixing a metadata error when working from a cloned repository.

## 0.24.0 (2026-08-12)

### Resilient multi-target builds and improved Kotlin and Java code generation

This release makes multi-target SDK generation more reliable by isolating failures per language, so one broken target no longer blocks the rest. Kotlin and Java SDKs also gain significant improvements to naming, type handling, and composition.

- Multi-target builds now continue when one language fails, reporting errors per target instead of aborting the whole run.
- Kotlin and Java union variants are now named after their backing component instead of their schema title, making names more predictable and collision-free.
- Discriminator tags with a single legal value are now pinned as JSON constants in Kotlin and Java.
- Objects with only `additionalProperties` now generate dedicated holder classes in Kotlin and Java instead of generic maps, with validation and type safety.
- Kotlin and Java models composed with `allOf` now inherit their base's members instead of redeclaring them, significantly reducing generated code size for recursive models.

## 0.23.8 (2026-08-11)

### Fern extensions and TypeScript improvements

This release adds support for Fern's server naming, base path, and global parameter extensions, so Fern-generated OpenAPI documents keep their environments and constructor options. TypeScript SDKs now handle open object schemas and punctuated query parameters.

- Fern's `x-fern-server-name`, `x-fern-default-url`, `x-fern-base-path`, and `x-fern-global-parameters` extensions now map to client environments and constructor options.
- TypeScript SDKs now declare `[k: string]: unknown` index signatures for schemas marked `additionalProperties: true`, so you can access undeclared properties without casting.
- Query parameters with punctuated names like `time_ranges[]` now keep the document's exact spelling instead of an invented camelCase key when `propertyCasing: 'wire'` is set.
- Python discriminated unions no longer cause import errors or broken code samples for union request bodies.

## 0.23.7 (2026-08-11)

### Agent-friendly CLIs and package attribution

Generated CLIs are now agent-friendly with structured output formats and actionable error codes. All generated packages now attribute their publisher organization. Multiple fixes improve TypeScript, Python, and Ruby SDK quality.

- Generated CLIs now offer a token-efficient `toon` output format, classified error codes to branch on, and actionable hints for authentication and permission failures.
- All generated packages now take the publisher name, contact, and documentation URL from `organization` config in TypeScript, Python, Rust, PHP, C#, Java, Kotlin, and Dart.
- Generated CLIs now ship formatted source.
- Python SDK auth validation errors now name the client options to set rather than request headers, and HTTP Basic auth pairs credentials per scheme correctly.
- TypeScript clients now validate required credentials at construction and expose protected auth hooks per security scheme for customization.

## 0.23.6 (2026-08-08)

### Improved Rust type resolution and Ruby documentation quality

This release brings significant improvements to Rust SDK generation, including proper type resolution for wrapped references and cleaner generated code. Ruby SDK documentation is now complete and runnable, with corrected examples and proper installation instructions.

- Rust SDKs now resolve types wrapped in single-member `allOf` correctly, consistent with TypeScript, Go, Python, Java, Kotlin, Ruby, PHP, and C#.
- Generated Rust SDKs no longer export base structs that nothing in the crate refers to, resulting in cleaner public APIs.
- Ruby README examples are now complete and runnable, with client initialization, corrected error handling, and accurate code samples.
- Rust webhook signature verification now implements the Standard Webhooks scheme in full, fixing an issue where genuine deliveries were rejected.

## 0.23.5 (2026-08-08)

### Rust SDK modules and OAuth pagination fix

This release brings modular organization to generated Rust SDKs and resolves an issue preventing Rust OAuth from composing with pagination.

- Rust SDKs now split models into separate modules per resource instead of one flat file, improving navigation in large SDKs.
- Rust SDKs now compile when OAuth token exchange is combined with paginated operations.

## 0.23.4 (2026-08-08)

### TypeScript formatting checks and locked Ruby dependencies

This release fixes the formatting check in generated TypeScript SDK workflows and ships Ruby SDKs with a `Gemfile.lock`.

- The formatting check in generated TypeScript SDK workflows now passes, with Biome upgraded to 2.5.7 and formatting that stays stable across runs.
- Ruby SDKs now ship with `Gemfile.lock`, so contributors use consistent development toolchain versions.

## 0.23.3 (2026-08-08)

### Improved parameter naming and Ruby SDK refinements

This release refines how path parameters are named and ordered across TypeScript, Ruby, and Rust SDKs, with better handling of edge cases like reserved words and name collisions.

- TypeScript path parameters now use camelCase names instead of the raw wire spelling, consistent with the rest of the SDK.
- Ruby params classes now list path parameters first, in URL order.
- TypeScript methods no longer declare the same parameter name twice, which caused parse errors.
- Ruby SDKs no longer declare `writeOnly` properties on response models.
- Rust webhook events now use variant names based on the event type, with typed payloads instead of raw JSON.

## 0.23.2 (2026-08-07)

### Complete C# READMEs and cross-language fixes

This release rewrites README generation for the experimental C# target and fixes bugs across TypeScript, Go, Python, and Ruby SDKs.

- C# SDKs now generate complete READMEs with feature documentation, client options tables, pagination guides, and Agent Skill files, like the other targets.
- Go SDKs now URL-escape string path parameters and reject path traversal attempts, so requests cannot reach the wrong resource.
- TypeScript SDKs now declare property-less object schemas as `Record` types instead of empty interfaces, so free-form JSON bodies are usable.
- Python SDKs now type-check nested properties with reserved keyword names, by splitting them into private `TypedDict` bases.
- Ruby gem metadata now takes author, contact, and documentation links from `organization` config instead of generic branding.

## 0.23.1 (2026-08-07)

### Inheritance fixes and fuller Java and Kotlin client documentation

This release fixes inheritance handling and TypeScript path parameter typing, and documents the complete Kotlin and Java client surface.

- Kotlin and Java clients now document their complete API surface, including lifecycle methods and resource accessors.
- Subclasses now keep the members contributed by composition branches, even when a base class declares identical properties.
- Path parameters typed by models from other resources are now namespace-qualified in TypeScript, fixing compilation errors.

## 0.23.0 (2026-08-07)

### Improved formatting, authentication validation, and removed experimental docs target

This release ships automatic formatting for PHP, Dart, and C++ SDKs, validates authentication at client construction for Kotlin and Java, and removes the experimental docs target in favor of serving the generated OpenAPI document directly.

- The experimental `docs` target is removed, and generated SDKs still write `openapi.augmented.json`, which you can serve with `@scalar/api-reference` directly.
- PHP, Dart, and C++ SDKs are now formatted automatically with WebAssembly-based tooling, and each ships its formatter config so later format runs change nothing.
- Kotlin and Java clients now validate authentication at construction and fail with a helpful message when credentials are missing, instead of sending unauthenticated requests.
- Generated SDK workflows now check formatting for TypeScript, Python, Go, Dart, C++, and Rust, so shipped code stays formatted.

## 0.22.10 (2026-08-06)

### Ruby Sorbet enum fixes and runnable Rust READMEs

Ruby request enums are now spelled correctly for Sorbet users, and Rust READMEs show complete runnable programs.

- Ruby request enum types are now spelled correctly for Sorbet users when a schema is used in both requests and responses.
- Rust README quickstart and `api.md` setup blocks now show complete runnable programs that match the generated code samples.

## 0.22.9 (2026-08-05)

### Generated code samples are now formatted with real language formatters

Code samples generated for Go, Python, PHP, CLI, Rust, and TypeScript are now automatically formatted with each language's real formatter before they ship. Samples appear consistently styled in augmented OpenAPI documents, generated Markdown docs, and source doc comments.

- Generated code samples are now formatted with pinned WebAssembly builds of gofmt, ruff, mago, shfmt, rustfmt, and Biome.
- Formatted samples follow the style config each generated SDK ships, so snippets copied from docs do not change when first formatted in your project.
- Curated code samples from your OpenAPI document are preserved exactly as written.
- Formatters are pinned dependencies, so samples are styled identically on hosts without Go, Python, PHP, or shell tooling installed.
- Samples a formatter rejects ship unformatted instead of failing the run.

## 0.22.8 (2026-08-05)

### Webhook helpers for Java and Kotlin

Java and Kotlin SDKs gain webhook helpers in this release.

- Java and Kotlin SDKs now generate typed webhook helpers with signature verification, event unions, and client accessors.

## 0.22.7 (2026-08-05)

### C# SDK generation rebuilt, formatters move to WebAssembly

This release rebuilds the experimental C# target with JSON-backed models and dual service hierarchies, and moves formatters to WebAssembly so they no longer depend on host toolchains.

- C# SDKs now generate JSON-backed models, dual service hierarchies, pagination wrappers, and async streaming support.
- Go and Python formatters now run as WebAssembly builds, removing the dependency on host toolchains while improving speed and reliability.
- Rust request models now derive `Default` and gain builder constructors, removing verbose `None`-filling boilerplate.
- Ruby enum constants now keep digit-glued acronyms without spurious underscores.

## 0.22.6 (2026-08-05)

### Service interfaces and formatting updates

This release adds positional overloads and documentation to generated Java and Kotlin service interfaces, and formats TypeScript and Python SDKs automatically.

- Java and Kotlin service interfaces now have positional overloads, KDoc documentation, and resource management annotations.
- TypeScript SDKs are now formatted with Biome at generation time, and Python SDKs with ruff.
- Ruby clients now keep the nullability of map value schemas, fixing types for optional values in hash properties.
- Rust clients now send `Accept` headers, with content negotiation for streaming and vendor JSON types.

## 0.22.5 (2026-08-05)

### Code sample polish and Ruby and Rust improvements

This release improves the readability of generated code samples across all languages, names Ruby request body arguments after their models, and adds a runnable `Cargo.toml` to Rust installation snippets.

- Code samples in every language now separate the request from response handling with a blank line.
- Ruby SDKs now expose request body models as named keyword arguments matching their registered model name.
- Rust installation snippets now include a runnable `Cargo.toml` example with the required dependencies.

## 0.22.4 (2026-08-04)

### Java and Kotlin runtime improvements and pagination fixes

This release rebuilds the generated Java and Kotlin runtime core with improved error handling, logging, and client options. It also fixes pagination behavior in Ruby and adds PHP code sample generation.

- Java and Kotlin SDKs now generate operation-specific response classes and wrap every pagination scheme in page wrappers.
- The Java and Kotlin runtime now includes timeout, sleeper, clock, and log level options, plus per-status error exceptions and improved credential handling.
- Ruby auto-pagination no longer stalls after the first page, and query parameters are now comma-joined instead of repeated.
- PHP code samples are now generated and appear in the README, `api.md`, and `SKILL.md` with real argument values.
- In generated SDK repositories, retitling a release pull request to `release: <version>` now reliably releases that version, and the release pull request's version check always runs.

## 0.22.3 (2026-08-04)

### Client option defaults, improved Rust and Kotlin params, and rebuilt PHP SDK generation

This release applies configured client option defaults in every target, improves documentation accuracy in Rust, and rebuilds PHP SDK generation.

- Client options now honor configured default values in every language, applied after environment variables.
- Kotlin and Rust params classes now handle headers properly and resolve name collisions.
- Ruby streaming and pagination now work with custom event handlers and every pagination scheme.
- PHP SDK generation was rewritten, with PSR-4 file placement and params handling.
- Rust documentation now reflects the generated code accurately, with correct method names and type links.

## 0.22.2 (2026-08-03)

### Schema handling improvements and Ruby SDK rewrite

This release fixes schema coercion issues that caused property-less objects to be treated as closed instead of open maps, and ships the complete Ruby SDK rewrite with typed resources, webhook helpers, and repository scaffolding.

- Schemas with `additionalProperties: {}` are now treated as open maps instead of closed objects.
- Ruby SDKs now ship with a fully rewritten architecture, including typed resources, webhook helpers, and pagination support.
- C# SDKs now include repository scaffolding (`.editorconfig`, devcontainer, contribution guidelines).
- Rust SDKs gain a pluggable HTTP transport, the OAuth client-credentials flow, and improved pagination handling.
- Kotlin and Java SDKs now render dedicated enum, union, and model classes.

## 0.22.1 (2026-07-31)

### Improved Kotlin and Java SDK generation with better model placement and type safety

This release refines how Kotlin and Java SDKs are structured, with clearer model placement and package layouts. It also improves documentation accuracy by removing unreachable default values and adds better handling of quoted numeric samples.

- Kotlin and Java models are now placed by ownership, with resource-claimed models in resource directories and shared models at the root.
- Operation type names and package layouts now use camelCase directories and proper prefixes for client methods.
- Field documentation no longer includes unreachable default values on required parameters, preventing misleading assertions about server behavior.
- Quoted numeric samples are now normalized to their declared types, fixing type-check failures in generated code.
- Go SDK generation is faster on large OpenAPI documents.

## 0.22.0 (2026-07-31)

### Diagnostics engine and standalone CLI executables

This release introduces a structured diagnostics system that checks your OpenAPI documents and SDK configs, and ships CLI targets as compiled binaries that run without Node.

- A new diagnostics engine with 23 validation rules, suppressions, and auto-fixable config suggestions checks your OpenAPI document and config before generation.
- Generated CLIs now ship as standalone executables for Linux, macOS, and Windows, so `brew install` or a direct download works without Node.
- Generated CLIs include shell completion scripts for bash, zsh, and fish: run `mycli completion zsh` and eval it for Tab completion on commands and flags.

## 0.21.1 (2026-07-30)

### Reference cycle fixes across targets

This release refines how individual targets render reference cycles, so each one generates compact, compilable code.

- Reference cycles in schemas are now broken where they re-enter, so each declaration is expanded once and generated code stays compact.
- Python SDKs now use trailing imports and quoted forward references for mutually recursive models.
- Go SDKs now add pointers at cyclic named references to avoid invalid recursive types, and merged union roots spell cyclic fields correctly.
- Kotlin and Java models that reference themselves no longer shadow their enclosing class with nested accessor objects.
- Generated `LICENSE` files now name a real copyright holder instead of template placeholders, defaulting to the SDK name and current year.

## 0.21.0 (2026-07-30)

### Support for reference cycles and improved Go module paths

This release brings full support for OpenAPI documents with reference cycles across all target languages, plus new configuration options for Go module paths and improved handling of nullable components.

- SDKs now generate correctly for documents with reference cycles, without combinatorial expansion or running out of memory.
- Go targets now support `goModulePathOverride` to decouple module paths from repository names, with validation that prevents injection.
- Generated TypeScript, Python, and Go clients now default to the first configured environment instead of always choosing production.
- Nullable component references are now reused instead of being inlined at each usage site.
- Generated CLIs now include man pages for their commands, installed automatically through npm.

## 0.20.1 (2026-07-28)

### Performance improvements and configuration fixes

This release speeds up TypeScript SDK generation for large OpenAPI documents and fixes Homebrew formula configuration handling.

- TypeScript SDK generation is now much faster on large schemas.
- Homebrew formulas now respect the configured homepage and description instead of silently ignoring them.
- Go SDKs no longer include unused response structs for request-only models.
- Python webhook event payloads composed with `allOf` now render as subclasses, removing thousands of duplicated lines.

## 0.20.0 (2026-07-28)

### Speakeasy config import and faster compilation for large OpenAPI documents

This release imports Speakeasy `gen.yaml` configuration files and dramatically improves compilation speed for large OpenAPI documents.

- Speakeasy `gen.yaml` files can now be imported to configure package names, module names, and retry settings in every target language.
- Compilation is much faster for large OpenAPI documents.
- OpenAPI documents with many shared components now compile instead of slowing down exponentially and hanging.
- Registry manifests now use one-line summaries instead of multi-paragraph descriptions, fixing PyPI publish rejections.
- Python SDKs now name classes after their usage context and handle complex union variants without shadowing imports.

## 0.19.9 (2026-07-27)

### Better inheritance and cleaner type generation

This release improves how generated SDKs handle OpenAPI inheritance patterns, resulting in cleaner type hierarchies and smaller output bundles.

- TypeScript and Python SDKs now follow inheritance chains through wrapper schemas, reducing extra namespace exports.
- TypeScript SDKs now generate inheritance at nested declaration sites.
- Go SDKs no longer ship an unused JSON runtime package, reducing their size.
- Python SDKs now honor `x-stainless-naming` overrides for properties with special characters.
- Generated release workflows now let you set the version number by editing the release pull request title.

## 0.19.8 (2026-07-25)

### Go webhook parsing, Python ergonomics, and TypeScript param handling

This release improves generated SDKs across multiple languages with enhanced webhook support in Go, improved Python and TypeScript SDK ergonomics, and support for naming overrides through vendor extensions.

- Go SDKs now generate scoped webhook helper services for parsing and verifying webhook events, with clean container accessors.
- Python SDKs now ship the `aiohttp` extra correctly and expose auth headers publicly.
- Python SDKs now handle reserved keywords like `from` as aliased attributes for type-safe construction.
- TypeScript methods now handle params more cleanly, with query pass-through and object shorthand.
- `x-stainless-naming` overrides are now honored for property and type names across languages.

## 0.19.7 (2026-07-24)

### Scoped webhook helpers and improved type naming consistency

This release introduces scoped webhook parse and verify methods in Python and TypeScript SDKs, so you can configure namespace-scoped webhook unwrap methods that get their own dedicated resources and types. Operation type names now join resource and method segments verbatim.

- Python and TypeScript SDKs now support scoped webhook helpers that generate dedicated parse and verify resources under custom namespaces (for example `notifications.webhooks.parse_pet`).
- Operation class and type names in Python and TypeScript now join resource and method segments verbatim instead of de-duplicating shared prefixes.
- Python SDKs now name nested classes for scoped types correctly, preserving acronyms and initialisms inherited from parent types.
- TypeScript declaration files are now rewritten at build time to prevent type-check errors in consumer projects that disable `skipLibCheck`.

## 0.19.6 (2026-07-24)

### Type improvements across TypeScript, Python, Go, and Ruby

This release improves type accuracy across TypeScript, Python, Go, and Ruby SDKs. Generated clients now handle vendor JSON media types, pagination models, and authentication schemes more precisely.

- TypeScript clients now send the correct `Accept` header for vendor JSON media types like `application/vnd.pet.v2+json`.
- Python resource methods now type object and array query parameters instead of collapsing them to generic objects.
- Go array and map element type names now re-case generated names consistently.
- Ruby SDKs no longer break when an operation is named `initialize`, and request params classes are generated once per name.
- Pagination page type aliases are now declared once in their owning module and imported elsewhere, removing duplicate declarations.

## 0.19.5 (2026-07-23)

### Improved type inheritance and naming conventions across all languages

This release brings significant improvements to how SDKs handle inheritance, naming, and type generation across Go, Python, and TypeScript targets.

- Python and TypeScript SDKs now render `allOf` responses that extend a single public model as subclasses, avoiding duplicate field declarations and duplicated nested types.
- Go type naming is improved, with per-operation response families for repeated roots, enums named per usage, and better handling of nested resource params types.
- Python nested helper classes now use their full ancestry path in their names instead of short names with numeric suffixes.
- Webhook helpers are now opt-in through config, so webhook resources and signature verification are generated only when configured.
- `json` and `xml` now render as `Json` and `Xml` by default instead of `JSON` and `XML` in every language.

## 0.19.4 (2026-07-21)

### Code sample fixes and consistent response decoding

This release fixes how generated code samples name client instances, ensures all languages decode the same response body when an API offers multiple content types, and corrects several language-specific type and documentation inconsistencies.

- Code samples now import the configured client class name instead of overwriting it with the example variable name.
- Installation snippets in augmented OpenAPI documents now update when you rename a package, and each language appears only once.
- Kotlin and Java SDKs now return the JSON response body when an operation offers both JSON and text, as other languages do.
- C# SDKs now compile when multiple resources share the same leaf name, by placing service classes in namespaces.
- Generated documentation for C#, Rust, Dart, PHP, C++, and Swift now shows the actual type names those languages generate instead of generic placeholders.

## 0.19.3 (2026-07-21)

### Publishing improvements and Go and Python type fixes

Trusted publishing workflows are more reliable across all language targets.

- Publishing workflows for Python, Kotlin, Ruby, and other targets now use top-level dispatch to support OIDC trusted publishing.
- Go SDKs with object-typed query parameters that reference component schemas now compile.
- Python SDKs now place request-side types under their resource's path and use sibling param modules.

## 0.19.2 (2026-07-21)

### Agent skill files and improved publishing workflows

Generated SDKs now ship with `SKILL.md` files that teach AI coding agents how to install, authenticate, and call your API. Publishing workflows now support OIDC trusted publishing, and Go releases warm the public module proxy for immediate availability.

- Generated SDKs now include `SKILL.md` files for AI agents, covering installation, authentication, API calls, pagination, streaming, WebSockets, and error handling (opt out with `settings.agentSkill: false`).
- Publishing workflows now use OIDC trusted publishing with `workflow_dispatch` triggers instead of reusable workflows.
- Go SDKs now warm the public module proxy after each release, so packages are available on pkg.go.dev immediately.
- README files now use a consistent generic intro sentence and link to the `api.md` operation catalog instead of embedding the OpenAPI description.

## 0.19.1 (2026-07-20)

### Smarter type generation and model ownership improvements

This release refines how models are placed and exported across languages, with significant improvements to Go and TypeScript.

- TypeScript SDKs now export only configured models at the top level, so internal types no longer leak.
- Go SDKs now collapse open enum unions to their enum type instead of boxing them in an interface.
- Client-scoped models now live in the client methods module instead of shared files.
- Go SDKs now share enum declarations between read structs and params types where appropriate.
- Discriminator fields in Go response unions now list every variant value instead of only the first one declared.

## 0.19.0 (2026-07-17)

### Improved release workflow and version management

This release streamlines how generated SDKs are versioned and released. Release pull requests now target the default branch directly, making it easier to see what will ship. SDK versioning is now fully independent of the generator and managed by your own release tooling.

- Release pull requests now target the default branch directly, so they show the full pending release diff.
- Documentation for handling conflicted release pull requests and adopting existing repositories is improved.
- The release workflow now syncs merged releases back to the `scalar-next` integration branch automatically.

## 0.17.0 (2026-07-17)

### Generated SDKs now manage their own versions and releases

This release moves version ownership entirely to generated SDK repositories. Versions are no longer configured in the generator; instead, generated repositories start at 0.1.0 and use release-please to bump versions automatically from conventional commits. The platform manages the branch layout, which needs no secrets, personal access tokens, or workflow-approval settings in destination repositories.

- SDK versions are now managed by the destination repository, not the generator config: every generated package starts at 0.1.0, and release tooling reads the current version at runtime.
- Generated repositories now include release-please configuration: regenerated code lands on `scalar-generated`, merges into `scalar-next` with your custom code, and release pull requests open against `scalar-next` without manual approval.
- Releases are cut automatically on merge, publish through a reusable workflow, and promote to the default branch, all with the default GitHub token and no personal access token or GitHub App token.
- Go SDKs now generate typed union catch-all structs, reuse canonical params types across operations, and place shared models in the correct packages with clean nested type names.
- Breaking change: repositories generated by earlier versions must regenerate to adopt the new branch layout and release-please workflows, and the `versionFiles` field is removed from the manifest.

## 0.16.9 (2026-07-16)

### Improved union handling and pagination fixes across Go and Python SDKs

This release improves union type modeling in Go, pagination in several languages, and parameter handling. Generated SDKs now model complex union types more accurately and page through results correctly.

- Go SDKs now model heterogeneous unions (mixing scalars with objects or arrays) as typed sealed interfaces instead of falling back to `any`.
- Go path parameters now appear in method signatures in URL path order, fixing incorrect resource addressing when an OpenAPI document declares parameters out of order.
- Python cursor pagination now pages backward when a previous-cursor parameter is set.
- Python methods with `oneOf` request bodies now validate required argument groups at runtime before sending the request.
- Go SDKs now advertise non-JSON text response types (like `text/html`) in their `Accept` headers.

## 0.16.8 (2026-07-15)

### Go SDK naming improvements and Python date serialization

This release improves Go SDK type naming, removes duplicate types from Go SDKs, and fixes Python date serialization.

- Go SDKs now embed `allOf` branches backed by components instead of flattening them, removing duplicate types.
- Python SDKs now serialize date fields as ISO 8601 strings, fixing JSON encoding errors that previously stopped requests from being sent.
- Go type naming is now more accurate for response unions, shared components, and request body types.

## 0.16.7 (2026-07-14)

### Rust edition 2024, Go SDK refinements, and improved type safety

This release upgrades generated Rust crates to edition 2024 and brings major improvements to Go SDK generation, including better enum handling, typed union types, and more consistent naming.

- Generated Rust crates now target edition 2024 with `rust-version` 1.85, fixing build issues with older Cargo versions.
- Rust string enums now capture unrecognized values in an `Unknown(String)` variant that preserves the original value on round-trip.
- Go SDKs now generate shared top-level enums for configured models instead of duplicating them per usage.
- Go SDKs now generate typed unions for `oneOf` and `anyOf` response bodies instead of falling back to `map[string]any`.
- Go naming is improved: discriminated `oneOf` request bodies are marked required, enum constants drop a spurious `Value` prefix, and `ttl`, `ui`, and `ip` use consistent initialism casing.

## 0.16.6 (2026-07-11)

### Go binary streaming, Python WebSockets, and union body improvements

This release improves generated Go and Python SDKs with better handling of binary responses, WebSocket connections, and polymorphic request bodies. Shared models and acronym casing are also more consistent across generated SDKs.

- Go SDKs now stream binary responses as `*http.Response` instead of buffering them into memory, as TypeScript and Python SDKs do.
- Python SDKs gained typed WebSocket support with event handlers, pre-connect send queues, and raw receive and send helpers.
- Go SDKs now generate sealed interface unions for `oneOf` and `anyOf` request bodies when every variant is a local type.
- Python SDKs now organize shared models into a dedicated `types/shared/` subpackage and resolve nested response model references correctly.
- Go SDKs now apply initialism casing to acronyms like `SKU` in exported identifiers while keeping wire format tags.

## 0.16.5 (2026-07-10)

### Improved Python and Go SDK generation with multipart uploads and WebSocket support

This release brings significant improvements to Python and Go SDK generation, including proper multipart file upload handling, WebSocket connection support, better type modeling, and refined response handling.

- Go SDKs now serialize `multipart/form-data` request bodies with file uploads using the multipart encoder instead of JSON.
- Python SDKs gained full WebSocket support with typed event handlers, message queues, and raw send and receive helpers.
- Python response models now resolve nested references correctly and organize shared types into a dedicated subpackage.
- Python paginated methods now use proper item types instead of falling back to generic object types.
- Empty-response methods now keep `application/json` `Accept` headers when configured.

## 0.16.4 (2026-07-09)

### Constructor option aliases and backward cursor pagination

Clients can accept constructor option names an existing SDK used, and TypeScript pagination pages backward through previous-cursor fields.

- `clientSettings.baseUrlAliases` lets clients accept constructor option names from other generators, like Speakeasy's `serverURL`.
- TypeScript pagination now preserves backward cursor pagination when using previous-cursor request fields.

## 0.16.3 (2026-07-09)

### Improved response type naming

This release fixes how generated SDKs name response types when you declare models by endpoint reference.

- Response types now use the declared model name when you register a component by endpoint reference, instead of falling back to an operation-derived name.
- Single-use paginated list envelopes get operation-derived names, while shared envelopes keep their configured names.

## 0.16.2 (2026-07-08)

### Python WebSocket improvements and TypeScript union naming refinements

This release improves Python WebSocket methods with better parameter handling and shared connection state, and refines TypeScript union member naming around wire discriminator tags.

- Python WebSocket connect methods now expose path parameters and options as typed arguments, with a shared send queue.
- TypeScript union member interfaces are now named after their wire discriminator tags or owning properties.
- Empty object schemas now generate named empty interfaces instead of generic records, preserving type names across migrations.

## 0.16.1 (2026-07-08)

### Improved Python imports and deprecation hints

This release ships cleaner Python import deduplication and fixes for deprecated method hints across all languages.

- Python resource modules now deduplicate their imports, so a type used by several operations is imported once instead of once per method.
- Deprecated method hints now show the canonical method name in each target language's own casing convention.
- Python request body types are now generated as params-only `TypedDict` files instead of reusing response model optionality.
- TypeScript list-envelope models now declaration-merge with their resource class instead of forcing a rename.

## 0.16.0 (2026-07-08)

### Auto-discovered pagination and improved TypeScript SDK generation

This release brings smart pagination detection for list operations and a new opt-in SDK-style casing mode for TypeScript. Multiple fixes land for generated Python, Go, Kotlin, and TypeScript SDKs.

- List operations now detect pagination schemes automatically when importing configurations, matching request parameters and response fields against configured pagination patterns to generate typed page helpers.
- TypeScript SDKs can now opt into idiomatic camelCase property names with `propertyCasing: 'sdk'`, while still sending and reading the correct wire names through schema-guided request and response mapping.
- Generated TypeScript SDKs now organize shared models in a single `src/resources/shared.ts` module and re-export them from the client namespace for easier migration.
- Code samples now use OpenAPI examples and schema formats when available, producing more realistic samples in every target language.
- Python request types now preserve nested union-of-object shapes instead of collapsing to `object`, and reserved keyword field names are handled through private `TypedDict` bases.

## 0.15.2 (2026-07-07)

### Improved name collision handling and Python SDK enhancements

This release improves how the generator handles name collisions across all language targets, ensuring unique model and method names while keeping the names from your OpenAPI document readable. Python SDKs now generate more idiomatic code with better support for union request bodies, multipart uploads, and binary responses.

- Model and method names are now globally unique, with deterministic collision resolution in every target.
- TypeScript exports now resolve name collisions by keeping the names from your OpenAPI document and renaming the generator's own internal names instead.
- Python SDKs now generate overloaded method signatures for union request bodies and handle multipart file uploads.
- Go and Rust SDKs now use consistent numeric suffixes for name collisions.
- Generated CLI commands now point at renamed root resources correctly when those collide with client member names.

## 0.15.1 (2026-07-04)

### Fixed TypeScript resource class name collisions

This release fixes a naming issue in generated TypeScript SDKs.

- TypeScript SDKs no longer generate colliding resource class names when operation models are configured on parent resources.

## 0.14.0 (2026-07-03)

### Generator version tracking and TypeScript naming improvements

Generated SDKs now include provenance metadata that records which generator version produced them, making it easier to track SDK origins and ensure reproducible builds.

- Every generated SDK now includes a manifest file with a `generatorVersion` field recording the exact generator version that created it.
- TypeScript resource class names no longer collide across unrelated nested resources, reducing numeric suffixes in generated code.
- Generated TypeScript SDKs now expose WebSocket send and receive event aliases through resource index modules and client namespaces.
