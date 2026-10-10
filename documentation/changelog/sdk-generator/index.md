# SDK Generator

<!--
  Rendered from the SDK generator's release notes on every release. Edits
  made here will be overwritten - change the release notes at the source
  instead.
-->

Curated release notes for the Scalar SDK Generator. Each entry summarizes what shipped across every target language in that release.

## 0.36.5 (2026-10-09)

### OAuth token revocation, resource indicators, and query parameter fixes

This release adds OAuth token revocation when signing out of generated CLIs, introduces resource indicators for requesting API-specific tokens, and fixes query parameter serialization in Java and Kotlin SDKs.

- Generated CLIs now revoke OAuth tokens at the provider when you sign out, using RFC 7009 endpoints configured via `targets.cli.credentialStore.oauth.revocationUrl` or discovered from OpenID Connect metadata
- Request OAuth tokens for a specific API with `openapi.securitySchemeSettings.<scheme>.resource` and `audience`, sent by generated CLIs and Rust SDKs on all token requests
- Java and Kotlin SDKs now correctly follow OpenAPI `explode` for query parameters when `querySettings.arrayFormat` is not set, repeating keys instead of comma-joining
- Ruby SDKs now spell boolean and numeric enum members as their JSON types instead of symbols, fixing wire serialization for `true`, `false`, integers and floats
- Kotlin and Java SDKs publishing to Maven Central now release uploads automatically instead of requiring manual approval in the Central Portal

## 0.36.4 (2026-10-09)

### Per-target config gates now isolate each SDK

This release ensures per-target configuration gates apply independently to each SDK, so skipping operations or models for one target no longer affects the others. Multi-target runs now compile once per unique gate configuration rather than rebuilding identical SDKs.

- Per-target `only` and `skip` gates now apply to each target independently, so a resource or method skipped for one target does not appear in that SDK even when another target keeps it
- Multi-target runs compile once per group of targets treated identically by the gates, improving build performance while ensuring each SDK is generated correctly
- A resource skipped for a target also drops its methods, subresources, and models declared under it for that target only
- Webhook unwrap helper gates and streaming overload flags are now honored in single-target and multi-target runs alike
- Code samples follow the same per-language gates, and every target now honors document-level per-target skip lists on union variants and object properties

## 0.36.3 (2026-10-05)

### Python item-cursor pagination types

Python SDKs with item-cursor pagination now declare a protocol for cursor items, so imports and type checking work correctly.

- Python SDKs with item-cursor pagination now declare a runtime-checkable Protocol for cursor items, making imports and type checking work correctly

## 0.36.2 (2026-10-05)

### README type accuracy, Python union fixes, and Go and Ruby naming fixes

This release improves README documentation accuracy across all target languages, fixes several Python SDK bugs related to union types and recursive structures, and corrects Go union routing and Ruby attribute naming.

- README authentication and client options tables now show the exact types each language declares, matching what users see in their generated SDKs
- Fixed Python SDKs silently dropping wire aliases and date formatting inside recursive request unions
- Python union response variants that extend a model now properly subclass it instead of duplicating all fields
- Go discriminated unions now only route by discriminator when each variant has a unique value, preventing incorrect decoding
- Ruby attributes that shadow builtin methods now include a trailing underscore to avoid conflicts

## 0.36.1 (2026-10-02)

### Keychain support for CLI credentials, aliases for renamed types, and Go identifier fixes

This release improves credential management on macOS, adds aliases for renamed types in TypeScript and Python, and fixes Go identifier formatting issues.

- Generated CLIs now store credentials in the macOS Keychain, using the system security utility for secure storage that works across npm and binary distributions
- TypeScript SDKs support type aliases through backCompat.typeAliases, keeping legacy type names and imports working after types are renamed or nested
- Python SDKs support import path aliases so existing imports keep working when types move or are renamed, with optional deprecation messages
- Go SDKs now correctly handle nested model types in request parameters and format identifier segments like 'sla' as 'Sla' instead of 'SLA'
- Python request serialization now resolves forward-referenced union members, fixing runtime errors when sending requests with recursive union types

## 0.36.0 (2026-09-30)

### Self-verification, CLI environment selection, and Go pagination pages

This release brings self-verification of generated Go code, fixes CLI credential routing across environments, and generates page types for Go pagination. C++ webhook signature verification now works correctly, and several type inference fixes improve Go SDK quality.

- Emitters can now verify their output before files are written, with the Go target checking generated samples for struct fields assigned the wrong type. Invalid code is withheld and reported as Target/InvalidGeneratedCode.
- CLI commands now match stored credentials to the selected environment. Login and logout accept --environment, and the CLI reads a new PREFIX_ENVIRONMENT variable.
- Go SDKs now generate proper page types for page-number and offset pagination, with GetNextPage and AutoPaging methods that handle totals and empty pages correctly.
- C++ webhook signature verification now implements the Standard Webhooks HMAC scheme correctly, with constant-time comparison and timestamp tolerance checking.
- TypeScript SDKs no longer shadow globals like Response or FormData in client.ts, and Go request enums are typed correctly when fields reference the same component.

## 0.35.2 (2026-09-28)

### Homebrew cask publishing

This release adds support for publishing generated CLIs as Homebrew casks.

- Publish generated CLIs to Homebrew as casks with `targets.cli.publish.homebrew.cask: true`, supporting macOS notarization and shell completions
- Migrate users from Homebrew formulas to casks automatically with `replaceFormula: true` and tap migration support
- Generated Homebrew packages now pass `brew audit --strict` and `brew style` validation
- Install from third-party Homebrew taps using fully qualified names to avoid conflicts with official packages

## 0.35.1 (2026-09-28)

### macOS binary signing and credential fallback for generated CLIs

This release adds code signing support for macOS CLI binaries and accepts publishing credentials under standard secret names used by other generators, making setup easier for repositories that already have those secrets configured.

- Generated CLIs can now sign macOS binaries with a Developer ID certificate and optionally notarize them, so they run on Apple Silicon without Gatekeeper warnings.
- Release workflows accept publishing credentials under common secret names from other generators as fallbacks, so repositories with existing PyPI, RubyGems, Homebrew, or Maven Central secrets publish without adding new ones.
- Code signing runs on Linux using rcodesign and validates credentials early in the workflow, before compilation and any npm publish.

## 0.35.0 (2026-09-26)

### Configure your integration branch and control how CLI commands nest

You can now name the branch where generated code is merged with custom work, choose how CLI subresources appear in help text and completions, and migrate a Homebrew tap from a cask to a formula without leaving two copies installed.

- Set `destinations.production.integrationBranch` to control which branch receives generated releases and versioning commits (defaults to `scalar-next`).
- Choose `targets.cli.subresourceSeparator` as `colon` for `projects:tasks create` or `space` for `projects tasks create` in generated CLIs.
- Enable `publish.homebrew.pullRequest` to open a pull request against protected taps instead of pushing directly.
- Turn on `publish.homebrew.replaceCask` to migrate users from a cask to a formula automatically when the cask installs the same CLI command.
- Go SDKs now name discriminated union arms and request constructors after their tags, and organize response fields in a stable order.
- Swift SDKs ship a `<Module>SmokeTest` harness that runs every operation against a mock server and reports results in JSON, like the other targets.

## 0.34.0 (2026-09-24)

### Fern project detection and SDK variables support

This release adds automatic detection of Fern-annotated documents and support for x-fern-sdk-variables, which moves common path parameters like workspace or project IDs from method arguments to client constructor options. The generator also ships major performance improvements for large APIs and adds Swift code samples to the augmented OpenAPI document.

- Fern-annotated OpenAPI documents are now read the Fern way when no config exists, deriving starter configuration from x-fern-* extensions for grouping, method names, pagination, and more
- Path parameters marked with x-fern-sdk-variable become client constructor options in TypeScript, Python, Java, Kotlin and CLI targets, simplifying method signatures for multi-tenant APIs
- Generation of large SDKs is now much faster, especially for C# and Go
- SDK code samples are now generated for each named example in the request body, linked by example name and content type for the API reference example switcher
- Swift code samples are now added to the augmented OpenAPI document with typed arguments, pagination support, and streaming operations

## 0.33.5 (2026-09-23)

### Better error messages and Go SDK improvements

This release improves error handling for unresolvable references, improves Go SDK generation, and adds support for custom organization logos in CLI sign-in pages.

- Reference resolution errors now explain exactly what went wrong and where, instead of throwing raw errors
- Go SDKs now honor skip directives for specific targets
- CLI sign-in pages can display custom organization logos with the new organization.logo config field
- Go v2 SDKs now place parent path parameters in the params struct rather than taking them positionally
- Swift SDK emitter rebuilt from scratch with improved models, enums, and union handling

## 0.33.4 (2026-09-22)

### Swift formatting, Go union fixes, Python circular import guards, and CLI environment picker

This release brings automated Swift formatting with the WebAssembly swift-format, fixes for Go union declarations and name collisions, circular import guards for Python type re-exports, and a new environment picker for generated CLIs.

- Generated Swift SDKs are now formatted with the pinned WebAssembly swift-format, eliminating the need for a Swift toolchain on the host machine.
- Swift deployment floor drops to macOS 12 and iOS 15, and name collisions after escaping no longer emit duplicate declarations.
- Go SDKs now correctly declare component oneOf unions that no resource configures, fixing compilation errors.
- Python type package indexes defer eager re-exports when they would close a circular import, and forward-reference rebuilds now bind the full dotted module path.
- Generated CLIs for APIs with multiple environments now support a global --environment flag with shell completions and a new environments command.

## 0.33.3 (2026-09-20)

### Credential redaction in TypeScript request logs

TypeScript SDKs now redact the credentials your API description names wherever they log a request.

- TypeScript request logs now redact the credential headers and query parameters your API description names, not only a fixed list of common header names.

## 0.33.2 (2026-09-18)

### Credential stores, OAuth improvements, and multi-scheme authentication

This release stores generated CLI credentials in the operating system's credential store, improves OAuth flows, fixes SDKs for APIs that offer several authentication options, and reports unsupported OpenAPI operations instead of omitting them.

- Generated CLIs now store credentials in your operating system's native credential store (Secret Service on Linux, Credential Manager on Windows), falling back to a permission-restricted file when no store is available.
- OAuth flows gained device authorization support, better refresh token handling, and a styled callback page for browser-based sign-ins.
- Smoke test harnesses now configure sensible retry counts and timeouts, preventing builds from failing on transient network issues.
- Schema metadata such as defaults, examples, extensions, and readOnly flags written beside a `$ref` is now preserved.
- Reject unsupported OpenAPI operations (QUERY, CONNECT, custom methods) and querystring parameters with source locations instead of silently omitting them.
- Fix credential handling for APIs that offer multiple authentication alternatives so SDKs no longer demand every credential at once.
- Update GitHub Actions in generated workflows to versions that run on Node.js 24 and configure Gradle cache settings for private repositories.
- Render documented enum defaults in Java and Kotlin code samples instead of always showing the first enum member.

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

Adding operations can silently move methods to new subresources when SDK structure is derived from the spec. This release warns when public accessors change or disappear.

- Generation now warns when re-deriving resource placement renames or removes public methods, helping catch breaking changes before publish
- Improved CLI error messages that no longer reference SDK constructor APIs unavailable to command-line users
- TypeScript SDKs can now type `format: date-time` fields as JavaScript `Date` objects with `targets.typescript.options.dateTimeType: 'Date'`
- Documents can now declare pagination schemes, response unwrapping, and client settings directly via extensions like `x-scalar-pagination` and `x-scalar-sdk-settings`

## 0.32.14 (2026-09-14)

### Improved streaming support and model naming across languages

This release brings clearer streaming implementations across all targets, with dedicated decoders for JSON Lines responses and improved type safety. It also fixes a critical bug where generated types could shadow language built-in generics, causing compilation failures.

- Fixed models named after language generics (like Array, List, Record) that previously shadowed built-in types and broke compilation
- Added dedicated JSON Lines stream decoders for TypeScript, Python, C#, Go, Ruby, PHP, and Kotlin, replacing the shared SSE handler
- Go v2 shape now supports heterogeneous response unions mixing scalar and composite types, with flattened struct representations
- TypeScript non-string header parameters are now properly stringified, fixing compilation errors for boolean and numeric headers
- C# SDKs now stream newline-delimited JSON responses with Core/Jsonl.cs

## 0.32.13 (2026-09-11)

### Clearer error class names in TypeScript SDKs

Generated TypeScript SDKs now report distinct error class names for better debugging and log grouping.

- TypeScript error classes now report their actual names instead of generic 'Error', making debugging and error tracking much easier

## 0.32.12 (2026-09-11)

### Improved package registry linking and deprecated schema handling

This release enhances how the SDK generator links to package registries across different platforms and fixes an issue where deprecated response schemas caused mock servers to return empty bodies during testing.

- Package registry URLs now support platform-specific addressing schemes, including Maven Central artifacts, Go modules, and GitHub release binaries
- Mock servers no longer strip content from deprecated response bodies, ensuring generated clients can properly decode responses during testing
- PHP package name resolution now correctly prioritizes Composer package names over internal namespace identifiers
- Target stability is now defined in the config schema, with TypeScript, Python, Go, and CLI marked as stable

## 0.32.10 (2026-09-11)

### Improved streaming responses, CLI documentation, and Go SDK generation

This release improves content negotiation for streaming responses across all targets, adds command group descriptions to generated CLI tools, and fixes several Go SDK generation issues including websocket support and response type handling.

- Streaming responses now send the correct Accept header based on the API's declared media type instead of hardcoded values
- Generated CLI tools now display resource descriptions in command group listings, making help output more informative
- Long CLI command samples wrap across multiple lines for better readability in documentation and man pages
- Go SDK now properly handles websocket surfaces and non-JSON response bodies like zip archives

## 0.32.9 (2026-09-10)

### Go SDK v2 code style support and prerelease channel configuration

This release introduces support for generating Go SDKs in the newer v2 code style through the codeStyle configuration option. It also adds proper schema support for prerelease channels across all package-publishing targets.

- Go SDKs can now be generated in the v2 code style by setting targets.go.options.codeStyle to "v2", enabling the newer `v2` SDK shape (`param.Opt` optionals and union carriers).
- Prerelease channels are now properly declared in the configuration schema for all targets that publish packages.
- Rust SDK builds in the smoke test harness now share a single target directory and skip debug artifacts, significantly reducing build times.
- Go request unions now support the v2 carrier shape in generated SDKs.
- The default Go code style remains unchanged, ensuring existing SDKs continue to generate identical output.

## 0.32.8 (2026-09-09)

### Improved Go SDK generation

This release advances Go SDK generation with dialect-aware code samples and improved header handling.

- Go code samples now align with the SDK dialect being generated, with full support for v2 param structs and nullable fields
- Go header and cookie parameters are now correctly guarded and unwrapped based on the SDK dialect, with proper handling of optional and required fields

## 0.32.7 (2026-09-09)

### Faster SDK generation and improved config handling

This release brings substantial performance improvements to SDK generation across all target languages, with large OpenAPI documents generating noticeably faster. The release also fixes several language-specific issues.

- SDK generation is now significantly faster for all languages, with Go seeing the largest improvement.
- TypeScript generation is faster, with byte-identical output.
- Fixed C# response handling for non-JSON binary content, now returning raw HTTP responses instead of attempting JSON deserialization.
- Improved JVM (Java and Kotlin) SDK generation with correct handling of query parameters in path segments and nested class references in code samples.

## 0.32.6 (2026-09-08)

### Ruby gemspec metadata fix

This release fixes Ruby SDK metadata so generated gemspecs link to the repository correctly.

- Fixed Ruby SDK metadata to correctly strip branch suffixes from repository URLs in generated gemspecs.

## 0.32.5 (2026-09-08)

### CLI file uploads and JVM compilation fixes

This release fixes file uploads in generated CLIs and compilation of generated Java and Kotlin SDKs, and standardizes package install commands in augmented OpenAPI documents.

- CLI file uploads now read actual file contents instead of sending path strings, using curl-style syntax like `@file.pdf` or `--document @openapi.json`
- Generated Java and Kotlin SDKs now compile successfully, fixing conflicts with reserved method names and null handling in builder patterns
- Package install commands in augmented OpenAPI documents now use standardized templates from the registry catalog for npm and PyPI

## 0.32.4 (2026-09-08)

### Publishing configuration improvements and package identifier fixes

This release consolidates publishing registry metadata into a single source of truth, adds support for configuring npm package visibility and dist-tags, and fixes several package identifier generation bugs across Go, Swift, and other languages.

- Publishing registry setup instructions are now documented directly in the configuration schema, with detailed OIDC and token authentication steps for each registry.
- TypeScript SDKs can now configure npm package visibility with the access option and customize the stable dist-tag for packages that maintain multiple release channels.
- Go package identifiers now default to the configured client name instead of falling back to lengthy API slugs, producing more readable package declarations.
- Fixed Swift package identifier generation that was inadvertently renaming published packages when regenerating existing SDKs.
- Ruby targets using the legacy gem configuration key are automatically migrated to rubygems on load, preventing silent publishing failures.

## 0.32.3 (2026-09-06)

### Speakeasy pagination import and unified code samples

This release brings support for importing Speakeasy pagination configurations and unifies how code samples are generated across all target languages. SDKs generated from imported Speakeasy projects now generate pagination helpers, and code samples show consistent, realistic request data in every language.

- Speakeasy pagination extensions are now mapped to Scalar pagination schemes when importing a gen.yaml, so list endpoints in imported projects get typed page helpers.
- Code samples now show the same request data for an operation across all languages, with arrays properly filled and validation constraints like minItems honored consistently.
- C# SDKs now send configured default headers from the client and stop declaring a member for them, so client-wide headers apply to every request.
- Generated CLI now coerces repeatable flag values by their item schema, so empty strings stay empty and integers parse as numbers instead of becoming null.
- Smoke test harnesses now run cases in bounded worker pools and report contract violations without enforcing them, with improved error messages for connection failures.

## 0.32.2 (2026-09-04)

### Improved Fern project support

This release adds support for more Fern OpenAPI extensions. Projects using Fern's audience filtering, custom naming conventions, and SDK variables will now generate correctly.

- Fern projects now respect audience filtering via x-fern-audiences, converting excluded endpoints and properties to the equivalent Scalar configuration.
- Fern's naming extensions (x-fern-type-name, x-fern-property-name, x-fern-enum) are now read alongside x-scalar-* markers and behave identically.
- Fern projects declaring both Node and browser TypeScript generators no longer mix packaging — one client now runs in both environments.

## 0.32.1 (2026-09-03)

### Better validation, pagination fixes, and improved SDK quality across all targets

This release improves how generated SDKs handle numeric constraints, cursor-based pagination, and request bodies. Code samples now respect bounds declared in your OpenAPI documents, pagination advances on the correct parameters, and several targets gained fixes for text responses, binary uploads, and type retention.

- Code samples now honor numeric bounds like minimum, maximum, and their exclusive variants, producing realistic values that respect your schema constraints
- Cursor pagination now advances on the parameter your API actually declares instead of inventing one, fixing compilation errors in Kotlin and runtime failures in C#
- Generated C# SDKs can now call operations with binary request bodies and advance cursor_id pages off the last row's cursor
- Python SDK generation is significantly faster on documents with shared request models, and all imported types are now retained
- Rust SDKs serialize integer-valued numbers without decimal points and parse date-time fields leniently to handle real-world timestamp formats

## 0.32.0 (2026-08-29)

### Ruby trusted publishing and mock server fixes

Ruby SDKs can now publish to RubyGems using trusted publishing (OIDC) instead of long-lived API keys, and the mock server handles literal paths and string bodies correctly.

- Ruby SDKs now default to RubyGems trusted publishing (OIDC), eliminating the need to store long-lived credentials in destination repositories.
- Mock servers now correctly handle literal paths before templated ones, so `/profiles/legacy-search` is answered by its own operation instead of the `/profiles/{profileId}` template.
- String response bodies from the mock server are now properly encoded as JSON, removing the need for client-side workarounds.

## 0.31.1 (2026-08-28)

### npm publishing fix for generated CLIs

This release fixes npm publishing for generated CLIs.

- Fixed npm publishing for generated CLIs by including required repository metadata for provenance-signed releases

## 0.31.0 (2026-08-28)

### Speakeasy import improvements, faster Go and Ruby generation, and CLI package naming

This release improves importing Speakeasy projects and speeds up Go and Ruby generation for large documents. CLI package naming now uses more readable kebab-case by default.

- Imported Speakeasy projects now automatically read `x-speakeasy-name-override` and `x-speakeasy-globals`
- CLI packages now use kebab-case names (e.g. `scalar-galaxy-cli` instead of `scalargalaxy-cli`) with explicit override support via `targets.cli.packageName`
- Go SDK generation is significantly faster for large documents, and Go SDKs now compile correctly with proper union reference handling
- Ruby formatting now runs in parallel across worker threads, speeding up generation for large SDKs

## 0.30.1 (2026-08-27)

### Naming overrides, enum flattening, and type declaration fixes

This release adds support for vendor naming extensions across more schema positions, merges inline string enum unions into single enums, and fixes several target-specific bugs where declarations were missing or colliding.

- Honor x-stainless-naming overrides on component schemas and parameters, not just properties
- Flatten inline string enum unions into single enums (affects Go, Rust, Ruby, C#, Java, Kotlin)
- Respect x-stainless-param and x-stainless-renameMap for parameter and enum member names
- Fix C# to skip duplicate constructors and name demoted array elements after their component types
- Declare all referenced types in Go modules so generated code compiles without missing identifiers

## 0.30.0 (2026-08-25)

### Improved formatting resilience and pagination cursor handling

This release fixes critical issues in JVM target formatting, pagination cursor extraction, and parameter name collision handling across multiple languages.

- Fixed Kotlin and Java targets failing to format when a large file exceeded formatter limits. Both targets now produce complete SDKs with unformatted files reported rather than aborting the entire formatting pass.
- Pagination now correctly follows cursors nested inside envelope fields. APIs that return cursors like links.next now fetch multiple pages as expected in Python and TypeScript.
- Resolved parameter name collisions across targets. Parameters with similar names like status and status[] no longer conflict in Python, Ruby, Rust, and other languages.
- C# namespaces are now properly qualified when nested resources share names with top-level resources, preventing ambiguous reference errors.
- PHP page metadata fields with object shapes are now declared as proper models instead of strings, allowing access to nested properties.

## 0.29.0 (2026-08-24)

### Generated smoke tests now exercise optional parameters

Smoke tests verify API integration by calling every operation. Previously, they only tested required parameters, leaving optional query params, headers, and nested body fields unexercised. This release adds comprehensive coverage by calling each operation twice when it has optional arguments: once with required params only, and once with all params filled.

- Each operation generates up to two test cases: a minimal call with required params, and a maximal call that fills every optional argument the signature accepts.
- Test reports label each case as 'required params' or 'all params' so failures clearly identify which coverage level broke.
- Fixed latent bugs in Go, Python, and Kotlin sample generation that surfaced when optional fields reached previously untested code paths.
- Documentation samples (README, docstrings, augmented OpenAPI) keep their minimal shape, so guides remain focused on the simplest working call.
- Fixed Go recursive model handling to prevent stack overflows and infinite loops when schemas reference themselves.

## 0.28.0 (2026-08-21)

### AsyncAPI support and refined example rendering

This release extends vendor configuration support to AsyncAPI documents and improves how configured examples appear across all generated SDKs.

- Vendor configurations (Fern, Speakeasy) now derive their resource tree from AsyncAPI documents, enabling full WebSocket client generation when paired with third-party config files.
- README examples now respect the `readme.exampleRequests` configuration across all targets, opening with the operation you specify rather than the first one in alphabetical order.
- Generated Python, Go, C#, and JVM samples now render configured parameter values exactly as written and print the response property you nominate.
- Rust SDKs gain properly named sub-clients and request builders (no more model name collisions), box recursive union variants so they compile, and escape crate names that start with digits.

## 0.27.3 (2026-08-21)

### Code sample formatting and README customization

This release adds formatting for generated Kotlin and Java code samples, brings README configuration to life, and improves how generated CLIs and SDKs document their usage examples.

- Kotlin and Java code samples are now formatted with ktfmt and google-java-format at generation time, so snippets copied from documentation match the SDK's own code style exactly
- README headings and generator attribution can be customized through the readme config block, which now reaches generated SDKs across all supported languages
- CLI READMEs render their usage examples from configured example requests instead of sampling from the specification, showing the exact commands and arguments you choose to document
- Generated TypeScript now formats with Biome's WebAssembly build instead of spawning the CLI, making the formatter self-contained and platform-independent
- Code sample formatters boot before any sample is built, so formatters that start asynchronously are ready when needed rather than leaving samples unformatted

## 0.27.2 (2026-08-20)

### WebAssembly rustfmt, least-privilege CI, and security policies

Rust SDK generation no longer needs a Rust toolchain, generated CI workflows ask for only the permissions they use, and every SDK ships a security policy.

- Rust SDK generation no longer requires a Rust toolchain installed, using WebAssembly-compiled rustfmt instead.
- Generated CI workflows now declare least-privilege GitHub token permissions.
- Every target now ships a SECURITY.md file that clearly separates SDK and API vulnerability reporting.

## 0.27.1 (2026-08-18)

### Better documentation and improved packaging

This release improves SDK documentation across multiple targets and makes code sample generation more efficient by isolating dependencies.

- JVM SDKs now ship with real API documentation in their javadoc jars, replacing the previously empty artifacts published to Maven Central.
- README files for Java and Kotlin SDKs now include pasteable dependency coordinates for Gradle and Maven, rather than only build-from-source instructions.
- Generated resources are now documented with the OpenAPI tag descriptions their operations carry, lighting up service class documentation that was previously missing.
- Per-operation request timeouts are now respected on JVM, TypeScript and Python targets, fixing an issue where configured slow endpoints would time out early.

## 0.27.0 (2026-08-17)

### Connect protocol support and proto diagnostics

This release brings Connect RPC support for unary and server-streaming calls to the TypeScript target and improves diagnostics for proto inputs. Connect calls now send the correct protocol headers and decode error envelopes properly, while server-streaming calls decode frames into the same Stream interface as SSE methods. Proto-based SDKs gain detailed diagnostics for unsupported features and configuration issues, with fixes that locate findings at the declaring .proto file.

- TypeScript SDKs generated from proto files now send working Connect calls with proper protocol headers, error handling, and server-streaming support.
- Eight gRPC diagnostic rules registered with file locations and safe fixes, including query format mismatches and service placement issues.
- Generated SDKs now ship a .gitignore file that prevents build output from polluting the repository on first run.
- Java and Kotlin SDKs gained runtime improvements including proper async pagination, Optional returns from core APIs, and corrected JVM enum constant naming.

## 0.26.0 (2026-08-14)

### Generate SDKs from Protocol Buffers

You can now generate typed SDKs from gRPC services defined in Protocol Buffers. Point the generator at a compiled descriptor set or a directory of proto files, and it will produce SDKs with message models and client scaffolding in every language, and RPC methods wherever the target can send them.

- Generate SDKs from protobuf inputs: descriptor sets or proto directories alongside OpenAPI and AsyncAPI documents.
- Transcoded RPCs with google.api.http annotations compile to REST endpoints, enabling HTTP calls without a Connect runtime.
- Proto runs derive a starter config from the descriptor set when no config exists, naming the SDK after the proto package.
- JVM SDKs now correctly spell format: byte fields as String instead of ByteArray, fixing base64 text handling.
- Python SDK improvements: subclass relationships for allOf compositions, proper model imports in union variants, and accurate client method signatures.

## 0.25.1 (2026-08-14)

### Improved naming across targets

This release improves naming consistency across JVM, Python, and TypeScript targets.

- Fixed TypeScript and JVM targets to require non-optional request body parameters when the payload cannot accept an empty object.
- Improved JVM class naming to honor custom type names from extensions and preserve component titles for union arms.
- Fixed Python array element models to use component names instead of numeric suffixes for better code clarity.
- Removed unused type aliases from JVM targets when scalar components produce no actual class declarations.

## 0.25.0 (2026-08-13)

### AsyncAPI support and new diagnostics rules

This release adds AsyncAPI 3.x document support alongside OpenAPI, enabling SDK generation from AsyncAPI channels served over HTTP and WebSocket. The diagnostics engine now gates rules by document type and registers twelve previously anonymous AsyncAPI findings with their own documentation pages.

- AsyncAPI 3.x documents are now accepted, with channels lowered to streaming methods where the runtime supports them
- AsyncAPI channels served over http or https compile to streaming methods with the same framing logic OpenAPI operations already use—text/event-stream as SSE, NDJSON as JSON Lines
- Diagnostics rules now declare which document types they apply to, preventing OpenAPI-specific rules from reporting findings under the wrong grammar for AsyncAPI documents
- Twelve AsyncAPI-related diagnostic codes now have dedicated rules and documentation pages, including protocol support, supported schema formats, and channel configuration issues
- Generated Python SDKs now install correctly in editable mode with pip install -e, fixing a metadata generation error for contributors working from a cloned repository

## 0.24.0 (2026-08-12)

### Resilient multi-target builds and improved Kotlin/Java code generation

This release makes multi-target SDK generation more reliable by isolating failures per language, so one broken target no longer blocks the rest. The Kotlin and Java emitters received significant improvements to naming, type handling, and composition.

- Multi-target builds now continue when one language fails, reporting errors per target rather than aborting the entire run.
- Union variants in Kotlin and Java are now named after their backing component rather than their spec title, making names more predictable and collision-free.
- Discriminator tags with a single legal value are now pinned as JSON constants in Kotlin and Java.
- Objects with only additionalProperties now generate dedicated holder classes in Kotlin and Java instead of generic maps, with proper validation and type safety.
- Kotlin and Java models composed with allOf now borrow their base's members instead of re-minting them, significantly reducing generated code size for recursive models.

## 0.23.8 (2026-08-11)

### Fern extensions and TypeScript improvements

This release adds support for Fern's server naming, base path, and global parameter extensions, so Fern-generated OpenAPI documents keep their environments and constructor options. TypeScript SDKs now properly handle open object schemas and punctuated query parameters.

- Fern's `x-fern-server-name`, `x-fern-default-url`, `x-fern-base-path`, and `x-fern-global-parameters` extensions are now mapped to client environments and constructor options.
- TypeScript SDKs emit `[k: string]: unknown` index signatures for schemas marked `additionalProperties: true`, allowing you to access undeclared properties without casting.
- Query parameters with punctuated names like `time_ranges[]` now use the document's exact spelling instead of an invented camelCase key when `propertyCasing: 'wire'` is set.
- Fixed Python discriminated unions causing import errors and code sample generation issues for union request bodies.

## 0.23.7 (2026-08-11)

### Agent-friendly CLIs and package attribution

Generated CLIs are now agent-friendly with structured output formats and actionable error codes. All generated packages now properly attribute their publisher organization. Multiple fixes improve TypeScript, Python, and Ruby SDK quality.

- Generated CLIs ship with a token-efficient toon output format, classified error codes for branching, and actionable hints for authentication and permission failures
- All generated packages now attribute publisher name, contact, and documentation URL from organization config across TypeScript, Python, Rust, PHP, C#, Java, Kotlin, and Dart
- The CLI target now ships formatted source
- Python SDK auth validation errors name the client options to set rather than request headers, and HTTP Basic auth correctly pairs credentials per scheme
- TypeScript clients now validate required credentials at construction time and expose protected auth hooks per security scheme for customization

## 0.23.6 (2026-08-08)

### Improved Rust type resolution and Ruby documentation quality

This release brings significant improvements to Rust SDK generation, including proper type resolution for wrapped references and cleaner generated code. Ruby SDK documentation is now complete and runnable, with corrected examples and proper installation instructions.

- Rust SDKs now correctly resolve types wrapped in single-member allOf constructs, matching behavior across TypeScript, Go, Python, Java, Kotlin, Ruby, PHP, and C#
- Generated Rust SDKs no longer export unreferenced base structs that nothing in the crate can name, resulting in cleaner public APIs
- Ruby README examples are now complete and runnable, with proper client initialization, corrected error handling, and accurate code samples
- Rust webhook signature verification now implements the standard-webhooks scheme in full, fixing a security issue where genuine deliveries were rejected

## 0.23.5 (2026-08-08)

### Rust SDK modules and OAuth pagination fix

This release brings modular organization to generated Rust SDKs and resolves an issue preventing Rust OAuth from composing with pagination.

- Rust SDKs now split models into separate modules per resource instead of one flat file, improving navigation in large SDKs.
- Fixed a compilation issue in Rust SDKs that prevented OAuth token exchange from working with paginated operations.

## 0.23.4 (2026-08-08)

### TypeScript CI fixes and locked Ruby dependencies

This release fixes TypeScript SDK CI formatting checks and ships Ruby SDKs with a Gemfile.lock.

- TypeScript SDK CI formatting checks now pass correctly, with Biome upgraded to 2.5.7 and idempotent formatting.
- Ruby SDKs now ship with Gemfile.lock to ensure consistent development toolchain versions across contributors.

## 0.23.3 (2026-08-08)

### Improved parameter naming and Ruby SDK refinements

This release refines how path parameters are named and ordered across TypeScript, Ruby, and Rust SDKs, with better handling of edge cases like reserved words and name collisions.

- TypeScript path parameters now use camelCase naming instead of raw wire spelling, making method signatures more consistent with the rest of the SDK
- Ruby params classes now list path parameters first in URL order, improving readability
- Fixed TypeScript methods that declared the same parameter name twice, which previously caused parse errors
- Ruby SDKs no longer declare writeOnly properties on response models that never send them
- Rust webhook events now use meaningful variant names based on the event type, with properly typed payloads instead of raw JSON

## 0.23.2 (2026-08-07)

### Improved C# SDK generation with comprehensive documentation and cross-language fixes

This release completes C# SDK generation, fully rewriting README generation, and fixes critical bugs across TypeScript, Go, Python, and Ruby targets.

- C# SDKs now generate complete READMEs with feature documentation, client options tables, pagination guides, and Agent Skill files matching other language targets
- Go SDKs now properly URL-escape string path parameters and validate against path traversal attempts, preventing request mis-targeting
- TypeScript now declares property-less object schemas as Record types instead of empty interfaces, making free-form JSON bodies usable
- Python fixes type-checking for nested properties with reserved keyword names by splitting them into private TypedDict bases
- Ruby gem metadata now supports organization configuration with author, contact, and documentation links instead of generic branding

## 0.23.1 (2026-08-07)

### Inheritance fixes and fuller JVM client documentation

This release fixes inheritance handling and TypeScript path parameter typing, and documents the complete Kotlin and Java client surface.

- Kotlin and Java clients now document their complete API surface including lifecycle methods and resource accessors
- Fixed inheritance handling so subclasses properly retain members contributed by composition branches, even when a base class declares identical properties
- Path parameters typed by models from other resources are now correctly namespace-qualified in TypeScript, fixing compilation errors

## 0.23.0 (2026-08-07)

### Improved formatting, authentication validation, and removed experimental docs target

This release ships automatic formatting for PHP, Dart, and C++ SDKs, validates authentication at client construction for Kotlin and Java, and removes the experimental docs target in favor of serving the generated OpenAPI document directly.

- Removed the experimental `docs` target. Generated SDKs still write `openapi.augmented.json`, which can be served with `@scalar/api-reference` directly.
- PHP, Dart, and C++ SDKs are now formatted automatically using WebAssembly-based tooling. Each SDK ships its formatter config so downstream format runs stay no-ops.
- Kotlin and Java clients validate authentication at construction and fail with a helpful message when credentials are missing, rather than building a client that sends unauthenticated requests.
- Generated SDK CI now verifies formatting for TypeScript, Python, Go, Dart, C++, and Rust, ensuring shipped code stays formatter-clean.

## 0.22.10 (2026-08-06)

### Ruby Sorbet enum fixes and runnable Rust READMEs

Ruby request enums are now spelled correctly for Sorbet users, and Rust READMEs show complete runnable programs.

- Ruby enum types in request positions are now spelled correctly for Sorbet users when a schema doubles as both request and response.
- Rust README quickstart and api.md setup blocks now show complete runnable programs that match the generated code samples.

## 0.22.9 (2026-08-05)

### Generated code samples are now formatted with real language formatters

Code samples generated for Go, Python, PHP, CLI, Rust, and TypeScript are now automatically formatted with each language's real formatter before they ship. Samples appear consistently styled in augmented OpenAPI documents, generated Markdown docs, and source doc comments.

- Generated code samples are formatted with pinned WebAssembly builds of gofmt, ruff, mago, shfmt, rustfmt, and Biome
- Formatted samples match the style config each generated SDK ships, so snippets copied from docs do not change when first formatted in a user's project
- Curated code samples from your source OpenAPI document are preserved exactly as written
- Formatters run as lockfile-pinned dependencies, so generated samples are styled identically on hosts without Go, Python, PHP, or shell tooling installed
- Samples that a formatter rejects are shipped as generated rather than failing the run

## 0.22.8 (2026-08-05)

### Webhook helpers for Java and Kotlin

This release adds typed webhook helper surfaces for Java and Kotlin, with signature verification, event unions, and client accessors.

- Java and Kotlin SDKs generate typed webhook helper surfaces with signature verification, event unions, and client accessors.

## 0.22.7 (2026-08-05)

### C# SDK generation rebuilt, formatters move to WebAssembly

This release rebuilds C# SDK generation with JSON-backed models and dual service hierarchies, adds WebAssembly-based formatters that eliminate host toolchain dependencies, and improves JVM service implementations.

- C# SDKs now generate JSON-backed models, dual service hierarchies, pagination wrappers, and async streaming support
- Go and Python formatters now run through WebAssembly builds, removing dependency on host toolchains while improving performance and reliability
- JVM service implementations refactored, with request building consolidated in raw response views and proper validation support
- Rust request models gain Default derives and builder constructors to eliminate verbose None-filling boilerplate
- Ruby enum constants now preserve digit-glued acronyms without spurious underscores

## 0.22.6 (2026-08-05)

### Service interfaces and formatting updates

This release adds positional overloads and documentation to generated JVM service interfaces, and adds automatic formatting for TypeScript and Python SDKs.

- JVM service interfaces now have positional overloads, KDoc documentation, and proper resource management annotations
- TypeScript SDKs are now automatically formatted with Biome at generation time, Python SDKs with ruff
- Ruby clients preserve nullability of map value schemas, fixing type safety for optional values in hash properties
- Rust clients now send proper Accept headers, with content negotiation for streaming and vendor JSON types

## 0.22.5 (2026-08-05)

### PHP smoke tests, improved mocking, and code sample polish

This release adds PHP to the smoke test suite, fixes response mocking for error-shaped defaults and paginated lists, and improves the readability of generated code samples across all languages.

- PHP SDKs are now validated with automated smoke tests run against a mock server
- Mock server no longer serves error-shaped default responses as 200s when a success response exists
- Code samples across all languages now separate the request from response handling with a blank line for better readability
- Ruby SDKs now expose request body models as named keyword arguments matching their registered model name
- Rust installation snippets now include a runnable Cargo.toml example with required dependencies

## 0.22.4 (2026-08-04)

### JVM runtime improvements and pagination fixes

This release rebuilds the generated Java and Kotlin runtime core with improved error handling, logging, and client options. It also fixes pagination behavior in Ruby and adds PHP code sample generation.

- Java and Kotlin SDKs now emit operation-specific response classes and wrap all pagination schemes in page wrappers.
- JVM runtime core now includes timeout, sleeper, clock, and log level options, plus per-status error exceptions and improved credential handling.
- Ruby auto-pagination no longer freezes after the first page, and query params are now comma-joined instead of repeated.
- PHP code samples are now generated from method plans and appear in README, api.md, and SKILL.md with real argument values.
- Release PR version checks now gate on title prefix and author instead of branch name, preventing silent failures when retitling releases.

## 0.22.3 (2026-08-04)

### Client option defaults, improved Rust and Kotlin params, and a rebuilt PHP emitter

This release brings configured client option defaults to all targets, improves documentation accuracy in Rust, and rebuilds the PHP emitter.

- Client options now honor configured default values across all languages, falling back after environment variables
- Kotlin and Rust params classes gain proper header handling and collision resolution
- Ruby streaming and pagination now work correctly with custom event handlers and all pagination schemes
- PHP emitter rewritten with proper PSR-4 placement and params handling
- Rust documentation now accurately reflects generated code with correct method names and type links

## 0.22.2 (2026-08-03)

### Schema handling improvements and Ruby SDK rewrite

This release fixes schema coercion issues that caused property-less objects to be treated as closed instead of open maps, and ships the complete Ruby SDK rewrite with typed resources, webhook helpers, and repository scaffolding.

- Fixed schema objects with `additionalProperties: {}` being incorrectly treated as closed objects instead of open maps
- Ruby SDKs now ship with a completely rewritten architecture including typed resources, webhook helpers, and pagination support
- C# SDKs now include repository scaffolding (editorconfig, devcontainer, contribution guidelines)
- Rust SDKs gain pluggable HTTP transport, OAuth client-credentials flow, and improved pagination handling
- Kotlin and Java SDKs now render dedicated enum, union, and model classes

## 0.22.1 (2026-07-31)

### Improved Kotlin and Java SDK generation with better model placement and type safety

This release refines how Kotlin and Java SDKs are structured, with clearer model placement and package layouts. It also improves documentation accuracy by removing unreachable default values and adds better handling of quoted numeric samples.

- Kotlin and Java models are now placed by ownership, with resource-claimed models in resource directories and shared models at the root.
- Operation type names and package layouts now use camelCase directories and proper prefixes for client methods.
- Field documentation no longer includes unreachable default values on required parameters, preventing misleading assertions about server behavior.
- Quoted numeric samples are now properly normalized to their declared types, fixing type-check failures in generated code.
- Go SDK generation is faster on large specifications.

## 0.22.0 (2026-07-31)

### Diagnostics engine and standalone CLI executables

This release introduces a structured diagnostics system for analyzing OpenAPI specs and SDK configs, and ships CLI targets as compiled binaries that run without Node.

- New diagnostics engine with 23 validation rules, suppressions, and auto-fixable config suggestions that check your spec and config before generation.
- CLI targets now ship as standalone Bun-compiled executables for Linux, macOS, and Windows, so `brew install` or direct downloads work without requiring Node.
- Generated CLIs include shell completion scripts for bash, zsh, and fish — run `mycli completion zsh` and eval it for Tab completion on commands and flags.

## 0.21.1 (2026-07-30)

### Reference cycle fixes across targets

This release refines how individual targets render reference cycles, so each one generates compact, compilable code.

- Reference cycles in schemas are now cut at re-entry points, preventing combinatorial expansion while preserving one productive expansion per declaration
- Python emits trailing imports and quoted forward references for mutually recursive models
- Go adds pointers at cyclic named references to prevent invalid recursive types, and merged union roots now spell cyclic fields correctly
- Kotlin and Java no longer shadow enclosing classes with nested accessor objects when models reference themselves
- Generated LICENSE files now stamp real copyright ownership instead of template placeholders, defaulting to the SDK name and current year

## 0.21.0 (2026-07-30)

### Support for reference cycles and improved Go module paths

This release brings full support for OpenAPI documents with reference cycles across all target languages, plus new configuration options for Go module paths and improved handling of nullable components.

- SDKs now generate correctly for documents with reference cycles, preventing combinatorial expansion and memory exhaustion
- Go targets support `goModulePathOverride` to decouple module paths from repository names, with validation to prevent injection attacks
- Generated TypeScript, Python, and Go clients default to the first configured environment instead of always choosing production
- Nullable component references are now properly reused instead of being inlined at each usage site
- CLI targets emit man pages for commands, installed automatically via npm

## 0.20.1 (2026-07-28)

### Performance improvements and configuration fixes

This release speeds up TypeScript SDK generation for large OpenAPI documents and fixes Homebrew formula configuration handling.

- TypeScript model ownership lookups are now much faster on large schemas
- Homebrew formulas now respect configured homepage and description instead of silently ignoring them
- Go SDKs no longer emit unused response structs for request-only models
- Python webhook event payloads now render as subclasses when composed with allOf, eliminating thousands of duplicated lines

## 0.20.0 (2026-07-28)

### Speakeasy config import and faster compilation for large specs

This release adds support for importing Speakeasy gen.yaml configuration files and dramatically improves compilation speed for large OpenAPI documents.

- Import Speakeasy gen.yaml config files to automatically configure package names, module names, and retry settings across all target languages
- Much faster compilation for large OpenAPI documents
- Fixed exponential slowdown on specs with shared components — documents with many shared components now compile successfully instead of hanging
- Registry manifests now use proper one-line summaries instead of multi-paragraph descriptions, fixing PyPI publish rejections
- Python SDK generator now correctly names classes after their usage context and handles complex union variants without shadowing imports

## 0.19.9 (2026-07-27)

### Better inheritance and cleaner type generation

This release improves how generated SDKs handle OpenAPI inheritance patterns, resulting in cleaner type hierarchies and smaller output bundles.

- TypeScript and Python now follow inheritance chains through wrapper schemas, reducing extra namespace exports.
- TypeScript generates inheritance at nested declaration sites.
- Go SDKs no longer ship unused respjson runtime package, reducing bundle size.
- Python honors x-stainless-naming overrides for properties with special characters.
- Generated release workflows now support editing version numbers directly in pull request titles.

## 0.19.8 (2026-07-25)

### Go webhook parsing, Python ergonomics, and TypeScript param handling

This release improves generated SDKs across multiple languages with enhanced webhook support in Go, improved Python and TypeScript SDK ergonomics, and support for naming overrides through vendor extensions.

- Go SDKs now generate scoped webhook helper services for parsing and verifying webhook events with clean container accessors
- Python SDKs ship the aiohttp extra correctly and expose auth headers publicly
- Python SDKs now handle reserved keywords like 'from' as inline aliased attributes for type-safe construction
- TypeScript methods use cleaner param handling with query pass-through and object shorthand
- Naming overrides from x-stainless-naming vendor extensions are now honored for property and type names across languages

## 0.19.7 (2026-07-24)

### Scoped webhook helpers and improved type naming consistency

This release introduces scoped webhook parse and verify surfaces in Python and TypeScript SDKs, allowing you to configure namespace-scoped webhook unwrap methods that materialize their own dedicated resources and types. We also refined operation type naming to concatenate resource and method segments verbatim.

- Python and TypeScript SDKs now support scoped webhook helpers that generate dedicated parse and verify resources under custom namespaces (e.g. `notifications.webhooks.parse_pet`).
- Operation class and type names in Python and TypeScript now concatenate resource and method segments verbatim instead of de-duplicating shared prefixes.
- Python emitter now correctly handles nested class naming for scoped types, preserving acronyms and fused initialism runs when inherited from parent types.
- TypeScript declaration files are rewritten during build finalization to prevent type-check errors in strict consumer projects that disable `skipLibCheck`.

## 0.19.6 (2026-07-24)

### Type improvements and publishing workflow updates

This release improves type accuracy across TypeScript, Python, Go, and Ruby SDKs. Generated clients now handle vendor JSON media types, pagination models, and authentication schemes more precisely.

- TypeScript clients now send the correct Accept header for vendor JSON media types like application/vnd.pet.v2+json
- Python resource methods now properly type object and array query parameters instead of collapsing them to generic objects
- Go array and map element type names now re-case synthesized names consistently
- Ruby SDKs no longer break when operations are named initialize, and request params classes are emitted once per name
- Pagination page type aliases are now declared once in their owning module and imported elsewhere, eliminating duplicate declarations

## 0.19.5 (2026-07-23)

### Improved type inheritance and naming conventions across all languages

This release brings significant improvements to how SDKs handle inheritance, naming, and type generation across Go, Python, and TypeScript targets.

- Python and TypeScript now render allOf responses as proper subclasses when extending a single public model, avoiding duplicate field declarations and nested type re-minting
- Go SDK type naming improved with per-operation response families for repeat roots, per-usage enum minting, and better handling of nested resource params types
- Python nested helper classes now use full ancestry paths in their names instead of short names with numeric suffixes
- Webhook surface is now opt-in via config, only generating webhook resources and signature verification when explicitly configured
- Fixed json and xml to render as Json and Xml by default instead of JSON and XML across all languages

## 0.19.4 (2026-07-21)

### Code sample fixes and consistent response decoding

This release fixes how generated code samples name client instances, ensures all languages decode the same response body when an API offers multiple content types, and corrects several language-specific type and documentation inconsistencies.

- Code samples now correctly import the configured client class name instead of overwriting it with the example variable name
- Installation snippets in augmented OpenAPI documents update when you rename a package, and each language appears only once
- Kotlin and Java now return the JSON response body when an operation offers both JSON and text alternatives, matching other languages
- C# SDKs compile when multiple resources share the same leaf name by placing service classes in namespaces
- Generated documentation for C#, Rust, Dart, PHP, C++, and Swift now displays the actual type names those languages emit rather than generic placeholders

## 0.19.3 (2026-07-21)

### Publishing improvements and Go and Python type fixes

Trusted publishing workflows are more reliable across all language targets.

- Publishing workflows for Python, Kotlin, Ruby, and other targets now use top-level dispatch to support OIDC trusted publishing.
- Go SDKs with object-typed query parameters that reference component schemas now compile correctly.
- Python SDKs now place request-side types under resource parent paths and use sibling param modules.

## 0.19.2 (2026-07-21)

### Agent skill files and improved publishing workflows

Generated SDKs now ship with SKILL.md files that teach AI coding agents how to install, authenticate, and call your API. Publishing workflows have been updated to support OIDC trusted publishing, and Go releases now warm the public module proxy for immediate availability.

- Generated SDKs include SKILL.md files for AI agents, covering installation, authentication, API calls, pagination, streaming, WebSockets, and error handling (opt out with settings.agentSkill: false)
- Publishing workflows now use OIDC trusted publishing with workflow_dispatch triggers instead of reusable workflows
- Go SDKs automatically warm the public module proxy after release so packages are immediately available on pkg.go.dev
- README files now use a consistent generic intro sentence and link to the api.md operation catalog instead of embedding the OpenAPI description

## 0.19.1 (2026-07-20)

### Smarter type generation and model ownership improvements

This release refines how the generator handles model ownership and type emission across languages, with significant improvements to Go and TypeScript.

- TypeScript now only exports configured models at the top level, eliminating leaked internal types
- Go emitter collapses open enum unions to their enum type instead of boxing to interface
- Client-scoped models are now properly routed to client methods modules instead of shared files
- Go emitter shares enum declarations between read structs and param families when appropriate
- Discriminator fields in Go response unions now list all variant values instead of first-declaration-wins

## 0.19.0 (2026-07-17)

### Improved release workflow and version management

This release streamlines how generated SDKs are versioned and released. Release PRs now target the default branch directly, making it easier to see what will ship. SDK versioning is now fully independent of the generator and managed by your own release tooling.

- Release PRs now show the full pending release diff by targeting the default branch directly
- Manual version overrides are now handled through the Scalar dashboard instead of PR title edits
- Improved documentation for handling conflicted release PRs and repository adoption scenarios
- The release workflow automatically syncs merged releases back to the scalar-next integration branch

## 0.17.0 (2026-07-17)

### Generated SDKs now manage their own versions and releases

This release shifts version ownership entirely to generated SDK repositories. Versions are no longer configured in the generator; instead, generated repos start at 0.1.0 and use release-please to bump versions automatically via conventional commits. The platform manages a clean branch topology that requires no secrets, PAT tokens, or workflow-approval settings in destination repos.

- SDK versions are now managed by the destination repository, not the generator config. All generated packages start at 0.1.0 and release tooling reads the current version at runtime.
- Generated repos emit release-please configuration and adopt a platform-managed branch topology. Regenerated code lands on scalar-generated, merges into scalar-next with custom code, and release PRs open against scalar-next with no manual approval required.
- Releases cut automatically on merge, publish through a reusable workflow call, and promote to the default branch—all with the default GitHub token and no PAT or App token needed.
- Go SDKs now emit typed union catch-all structs, reuse canonical param families across operations, and place shared models in the correct packages with clean nested type names.
- Breaking change: repos generated by previous versions must regenerate to adopt the new branch topology and release-please workflows. The versionFiles field is removed from the manifest.

## 0.16.9 (2026-07-16)

### Improved union handling and pagination fixes across Go and Python emitters

This release brings significant improvements to union type modeling in Go, better pagination support across multiple languages, and refined parameter handling. Generated SDKs now handle complex union types more accurately and page through results correctly.

- Go emitter now models heterogeneous unions (mixing scalars with objects or arrays) as typed sealed interfaces instead of falling back to any.
- Go path parameters now appear in method signatures in the same order they occur in the URL path, fixing incorrect resource addressing when specs declare parameters out of order.
- Python cursor pagination now correctly pages backward when a previous-cursor parameter is set.
- Python methods with oneOf request bodies now validate required argument groups at runtime before making HTTP requests.
- Go emitter properly advertises non-JSON text response types (like text/html) via Accept headers.

## 0.16.8 (2026-07-15)

### Go SDK naming improvements and Python date serialization

This release refines the Go SDK emitter, improving type naming accuracy and eliminating dead code, and fixes Python date serialization.

- Go SDK emitter now correctly embeds allOf branches backed by first-class components instead of flattening them, eliminating duplicate types.
- Python SDK now serializes date fields as ISO 8601 strings, fixing JSON encoding errors that previously dropped requests entirely.
- Go SDK type naming is now more accurate, with improved handling of response unions, shared components, and request body types.

## 0.16.7 (2026-07-14)

### Rust edition 2024, Go SDK refinements, and improved type safety

This release upgrades generated Rust crates to edition 2024 and brings major improvements to Go SDK generation, including better enum handling, typed union types, and more consistent naming.

- Generated Rust crates now target edition 2024 with rust-version 1.85, fixing previous build issues with older cargo versions.
- Rust string enums now capture unrecognized values in an Unknown(String) variant that preserves the original value instead of corrupting it on round-trip.
- Go SDK now emits shared top-level enums for configured models instead of duplicating them per usage.
- Go SDK synthesizes typed union types for oneOf and anyOf response bodies instead of falling back to opaque map[string]any.
- Improved Go SDK naming: discriminated oneOf request bodies are now marked required, enum constants drop spurious Value prefix, and ttl/ui/ip now use consistent initialism casing.

## 0.16.6 (2026-07-11)

### Go binary streaming, Python websockets, and union body improvements

This release improves generated Go and Python SDKs with better handling of binary responses, websocket connections, and polymorphic request bodies. Shared models and acronym casing are also more consistent across generated SDKs.

- Go SDKs now stream binary responses as *http.Response instead of buffering them into memory, matching TypeScript and Python emitters.
- Python SDKs gained typed websocket support with event handlers, pre-connect send queues, and raw receive/send helpers.
- Go SDKs emit sealed interface unions for oneOf/anyOf request bodies when all variants are local types.
- Python SDKs organize shared models into a dedicated types/shared/ subpackage and resolve nested response model references correctly.
- Go SDKs apply proper initialism casing to acronyms like SKU in exported identifiers while preserving wire format tags.

## 0.16.5 (2026-07-10)

### Improved Python and Go SDK generation with multipart uploads and WebSocket support

This release brings significant improvements to Python and Go SDK generation, including proper multipart file upload handling, WebSocket connection support, better type modeling, and refined response handling.

- Go SDKs now correctly serialize multipart/form-data request bodies with file uploads using the multipart encoder instead of JSON
- Python SDKs gained full WebSocket support with typed event handlers, message queues, and raw send/receive helpers
- Python response models now resolve nested references correctly and organize shared types into a dedicated subpackage
- Python paginated methods now use proper item types instead of falling back to generic object types
- Empty-response methods preserve application/json Accept headers when configured, matching expected API behavior

## 0.16.4 (2026-07-09)

### Constructor option aliases and backward cursor pagination

Clients can accept constructor option names an existing SDK used, and TypeScript pagination pages backward through previous-cursor fields.

- Configure `clientSettings.baseUrlAliases` to accept constructor option names from other generators, like Speakeasy's `serverURL`.
- TypeScript pagination now preserves backward cursor pagination when using previous-cursor request fields.

## 0.16.3 (2026-07-09)

### Improved response type naming

This release fixes how generated SDKs name response types when you declare models by endpoint reference.

- Response types now use the declared model name when you register a component by endpoint reference, instead of falling back to an operation-derived name.
- Single-use paginated list envelopes get operation-derived names, while shared envelopes keep their configured names.

## 0.16.2 (2026-07-08)

### Python websocket improvements and TypeScript union naming refinements

This release improves Python websocket methods with better parameter handling and shared connection state, and refines TypeScript union member naming around wire discriminator tags.

- Python websocket connect methods now expose path parameters and options as typed arguments with a shared send queue.
- TypeScript union member interfaces are now named after their wire discriminator tags or owning properties.
- Empty object schemas now generate named empty interfaces instead of generic records, preserving type names across migrations.

## 0.16.1 (2026-07-08)

### Improved Python imports and deprecation hints

This release ships cleaner Python import deduplication and fixes for deprecated method hints across all languages.

- Python resource modules now deduplicate their imports, so a type used by multiple operations is imported once instead of repeated per method
- Deprecated method hints now show the canonical method name in each target language's own casing convention
- Python request body types are now emitted as params-only TypedDict files instead of reusing response model optionality
- TypeScript list-envelope models now declaration-merge with their resource class instead of forcing a rename

## 0.16.0 (2026-07-08)

### Auto-discovered pagination and improved TypeScript SDK generation

This release brings smart pagination detection for list operations and a new opt-in SDK-style casing mode for TypeScript. Multiple fixes land for generated Python, Go, Kotlin, and TypeScript SDKs.

- List operations now auto-detect pagination schemes when transforming imported configurations, matching request parameters and response fields against configured pagination patterns to generate typed page helpers automatically.
- TypeScript SDKs can now opt into idiomatic camelCase property names with `propertyCasing: 'sdk'`, while keeping network payloads correct through smart request carriers and schema-guided response remapping.
- Generated TypeScript SDKs now organize shared models in a single `src/resources/shared.ts` module and re-export them from the client namespace for easier migration.
- Code samples now use OpenAPI examples and schema formats when available, producing more realistic and useful generated samples across all target languages.
- Python request types now preserve nested union-of-object shapes instead of collapsing to `object`, and reserved keyword field names are handled through private TypedDict bases.

## 0.15.2 (2026-07-07)

### Improved name collision handling and Python SDK enhancements

This release improves how the generator handles name collisions across all language targets, ensuring unique model and method names while keeping spec-derived identifiers readable. Python SDKs now generate more idiomatic code with better support for union request bodies, multipart uploads, and binary responses.

- Model and method names are now globally unique with deterministic collision resolution across all targets
- TypeScript exports resolve name collisions by keeping spec-derived names and moving generator bindings aside
- Python SDKs now generate overloaded method signatures for union request bodies and properly handle multipart file uploads
- Go and Rust emitters use consistent numeric suffixes for name collisions instead of language-specific schemes
- CLI commands now correctly reference renamed root resources that collide with client member names

## 0.15.1 (2026-07-04)

### Fixed TypeScript resource class name collisions

- TypeScript SDK generation now avoids name collisions when operation models are configured on parent resources

## 0.14.0 (2026-07-03)

### Generator version tracking and TypeScript naming improvements

Generated SDKs now include provenance metadata that records which generator version produced them, making it easier to track SDK origins and ensure reproducible builds.

- Every generated SDK now includes a manifest file with a generatorVersion field that captures the exact version of the generator that created it.
- TypeScript resource class names no longer collide unnecessarily across unrelated nested resources, reducing numeric suffixes in generated code.
- Generated TypeScript SDKs now expose WebSocket send and receive event aliases through resource barrels and client namespaces.
