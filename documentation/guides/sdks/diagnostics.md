# Diagnostics

Every build analyzes your API description (an OpenAPI or AsyncAPI document) and your SDK configuration together, and reports everything the generator had to skip, guess, or degrade. Each finding is graded, and you decide which grades fail the build.

A successful build tells you the SDK compiled. It does not tell you the SDK is complete. Generation is forgiving by design: an operation no resource places is simply absent, a schema with no properties becomes an untyped value, a pagination scheme nothing references is dead configuration. Each of those produces a perfectly valid SDK that is quietly missing something you meant to ship, and diagnostics are how you find out.

## How it works

Diagnostics run as part of every build. Almost every check runs after the document and configuration are loaded and compiled, and before any target is generated. One check, `Target/InvalidGeneratedCode`, runs after a target is generated and before its files are written; see [After generation](#after-generation).

<scalar-steps>
  <scalar-step id="diagnostics-load" title="Load">

The document is parsed and its references are resolved, and the configuration is parsed and validated against the schema. Anything that fails here — an unresolvable `$ref`, an invalid configuration — is reported as a finding rather than an opaque crash.

  </scalar-step>

  <scalar-step id="diagnostics-compile" title="Compile">

The document and configuration are compiled into the language-neutral model every language target is generated from. As it compiles, the pipeline records what it could not carry across: an endpoint that no longer exists, a pagination scheme it could not resolve, a schema pointer it had to leave untyped.

  </scalar-step>

  <scalar-step id="diagnostics-analyze" title="Analyze">

Rules read the document, the configuration, and the compiled result together, and add what the pipeline had no reason to notice — operations no resource places, schemas that would be better off as declared models, README examples that no longer match the API.

  </scalar-step>

  <scalar-step id="diagnostics-gate" title="Decide">

The findings are graded, suppressions are applied, and the result is checked against the failure thresholds in your [`diagnostics`](#severity-and-failing-the-build) settings. A build that fails these checks fails before any target is generated or written, so it never publishes a half-correct SDK.

  </scalar-step>
</scalar-steps>

The full report is part of the build output, whether the build passed or failed, so it is there in the build logs to read either way.

Two properties are worth knowing about, because they decide how much a finding can be trusted:

- **Most findings are facts, not guesses.** The loader, the configuration coercion, and the compiler report what they actually did. A `Config/StaleEndpoint` finding is not a second opinion about your configuration — it is the compiler saying that it skipped the method.
- **Rules and generation share one implementation.** Where a rule has to work something out for itself — the name a model would be generated under, whether a response media type can be decoded, which resource a schema belongs to — it calls the same helpers generation calls. A finding cannot drift away from what the generator actually does, because there is only one answer for both of them to read.

A rule that crashes never takes your build down with it. The engine isolates each rule, skips the one that failed, and records it as `Internal/RuleCrash`.

### After generation

`Target/InvalidGeneratedCode` is the generator checking its own output. After a target is generated, and before its files are written, the generator runs any compile check that target has. Today only the Go target has one: it catches a generated sample that assigns a struct field a type its declaration does not have.

A finding is graded and suppressed like any other, and it applies to one target only:

- At its default `error` grade, that target fails. Its files are not written, so it does not ship from this build, and the build is reported as failed. Every other target is still generated and written as usual.
- The finding means the generator produced code that does not compile. No edit to your configuration or your API description is the fix: contact Scalar support with the API description that triggers it.
- Suppressing the finding, or grading it below your [`failOn`](#severity-and-failing-the-build) level, lets the target through, and the code that does not compile is written and shipped. Do that only to unblock a release while the generator is fixed, scoped to the one target with a `{ "target": "go", "reason": "…" }` entry.

## Anatomy of a finding

Every finding carries the same fields, whichever rule produced it:

| Field | What it is |
| ----- | ---------- |
| **Code** | A stable `Category/RuleName` identifier, such as `Endpoint/NotConfigured`. Use it to grade, disable, or suppress the rule. Codes are never renamed once shipped. |
| **Severity** | `error`, `warn`, or `info`, after any override you configured. |
| **Location** | Where to look: `Config:63` or `OpenAPI:492` when the line is known, and the JSON pointer to the offending node otherwise. |
| **Message** | What happened and what it cost, in terms of the generated SDK, such as which method lost pagination or which type degraded to an untyped value. |
| **Provenance** | Which file holds the remedy: `config`, `document`, or `internal`. |
| **Suppression key** | The identity of this particular finding — an endpoint, a schema pointer, a scheme name — used to silence one occurrence without disabling the rule. |

Rendered, one finding reads like this:

```text
[WARN] Config/StaleEndpoint  Config:63  Configured endpoint "get /v1/cards/{card_token}" has no matching operation in the document; the method is skipped.
```

## Severity and failing the build

There are three severities. Five rules default to `error`: `Config/ParseError`, `Config/InvalidIntegrationBranch`, `Document/ReferenceError`, `Pagination/UnknownScheme`, and `Target/InvalidGeneratedCode`. The first four report input the generator cannot carry out as written: a configuration that does not parse, an integration branch it cannot use, a reference it cannot resolve, a pagination scheme that does not exist. `Target/InvalidGeneratedCode` is `error` for a different reason: the SDK it reports already fails to compile, so shipping it is never a passing outcome. Everything else, including every condition that used to pass silently, starts at `warn` or `info`, so the analysis never turns a healthy build red on its own.

| Severity | What it means |
| -------- | ------------- |
| `error` | Generation could not do what the input asked for, or produced code that does not compile. Fails the build under the default `failOn`. |
| `warn` | The SDK generated, but something was dropped, renamed, or degraded. |
| `info` | An observation worth acting on that costs nothing today, such as a schema that would be clearer as a declared model. |

Which severities fail the build is set in the [`diagnostics`](configuration.md#diagnostics) block of your SDK configuration:

```json
{
  "diagnostics": {
    "failOn": "error",
    "maxWarnings": 20,
    "rules": {
      "Endpoint/NotConfigured": "warn",
      "Schema/EnumHasOneMember": "off"
    }
  }
}
```

- `failOn` is the lowest severity that fails the build, and defaults to `error`. Set it to `warn` to hold the build to a stricter standard, or to `off` to report without ever failing.
- `maxWarnings` and `maxErrors` are checked independently of `failOn`, so you can let warnings through while capping how many of them accumulate. Exceeding either one fails the build.
- `rules` re-grades a rule by code. `off` disables it entirely, so it neither reports nor counts toward failing the build.

Overrides and suppressions are applied before these thresholds are checked, so a rule you graded down or a finding you suppressed cannot fail a build.

## Provenance: whose file holds the fix

Each rule declares which document a finding is a critique of, which is what separates "fix your API description" from "fix your configuration":

| Provenance | Meaning |
| ---------- | ------- |
| `config` | The remedy is an edit to your SDK configuration: place the endpoint, declare the model, bind the security scheme. |
| `document` | The remedy is an edit to your API description: a one-member enum, an undecodable response media type, undeclared root security. |
| `internal` | The generator reporting on itself (`Internal/RuleCrash`, `Target/InvalidGeneratedCode`), which critiques neither of your files. |

The configuration Scalar generates for you is meant to report **no** `config` findings on its first build: the configuration generator applies the same rules the analyzer checks. Findings with `document` provenance legitimately survive a first build, because no configuration can invent what the description does not say.

## Suppressing a finding

Sometimes a finding is correct and the situation is still intentional — an endpoint that is deliberately not in the SDK, an example that shows a failing request on purpose. Use `diagnostics.ignored` to record that intent, keyed by rule code:

```json
{
  "diagnostics": {
    "ignored": {
      "Schema/EnumHasOneMember": true,
      "Endpoint/NotConfigured": "get /internal/*",
      "Model/Recommended": [
        { "location": "ApiError", "reason": "expanded inline on purpose" },
        { "target": "go", "reason": "not shipped for Go yet" }
      ]
    }
  }
}
```

- `true` suppresses the rule everywhere. Prefer a narrower form when you can, so a new occurrence still gets reported.
- A string matches the finding's suppression key, exactly or with `*` as a wildcard.
- An entry list mixes `location` matches (the same key grammar) with `target` matches, and each entry can carry a `reason` that stays with the suppression.

Suppressing is not the same as disabling. A suppressed finding is still produced and still recorded — it just does not count toward failing the build — whereas `"rules": { "...": "off" }` stops the rule from running at all.

Every rule's suppression key is listed alongside it below.

## What we check

### Configuration and endpoints

For what a webhook helper declares and the companion methods it generates, see [Webhooks](webhooks.md).

| Rule | Default | Fires when | Suppression key |
| ---- | ------- | ---------- | --------------- |
| `Config/ParseError` | `error` | The SDK configuration fails to parse, or fails schema validation. One finding per validation error, pointing at the exact line. | Configuration pointer and failed keyword, such as `/targets/typescript:required:packageName` |
| `Config/StaleEndpoint` | `warn` | A configured endpoint has no matching operation in the document, so the method is skipped. Usually an operation that was removed or renamed while the configuration still places it. | The endpoint, such as `get /pets/{id}` |
| `Config/DuplicateEndpoint` | `warn` | Two methods in different resources place the same endpoint. Only the later placement survives, so the earlier method silently disappears. | The endpoint |
| `Config/InvalidAlias` | `warn` | A `kind: alias` method was left out because its `aliasTo` is missing, names no method, names a webhook unwrap or signed upload, names another alias or closes a cycle of aliases, or because its `positionalParams` name a parameter the target has no path parameter for. | The alias's dotted config address, such as `widgets.archive` |
| `Config/InvalidSignedUpload` | `error` | A signed-upload method is configured in a way the generator cannot honour — a `urlField` or `headersField` the response does not declare, a confirm step with an unfilled path parameter or arguments of its own, a file argument that collides with a parameter, or `initiateParams: "path"` on an initiating operation that requires more than its path — so it is left out of every SDK. | The method's configuration path, such as `files.upload` |
| `Config/WebhookTypeNameConflict` | `warn` | A webhook helper's `webhook.typeName` names its event union after a type the SDK already declares (a model, a webhook event, another helper's union, a websocket event type) or does not end in `Event`, so the helper keeps its default union name. | The `typeName` pointer, such as `/resources/webhooks/methods/parse/webhook/typeName` |
| `Config/WebhookHelperNameUnsafe` | `warn` | A webhook helper's `helpers.parseUnsafe` takes a verifying companion's name (`verify_signature`, `unwrap`, or the name given to either, on this helper or a sibling on the same resource). The method decodes without verifying, so it is not generated rather than read as one that verifies. | The `parseUnsafe` pointer, such as `/resources/webhooks/methods/parse/webhook/helpers/parseUnsafe` |
| `Endpoint/NotConfigured` | `info` | The document declares an operation that no resource places and `ignoredEndpoints` does not list. Configuration is the allow-list, so the operation is generated in no SDK at all. | The endpoint |
| `Method/BodyRootParamUnnamed` | `info` | A method's JSON request body is an inline schema with no `title` and the method sets no `bodyParamName`, so the public parameter name for the whole body is generator-derived rather than chosen. | The endpoint |
| `Target/NotRegistered` | `warn` | The configuration declares a target that has no generator, so the target is skipped instead of built. | The target id, such as `go` |
| `Config/InvalidIntegrationBranch` | `error` | A target's `destinations.production.integrationBranch` is not a usable branch name: not a safe git ref, the same as the default branch, reserved for a branch the platform manages, a parent or child path of one of those, or containing `--components--`. | The config path, such as `targets.go.destinations.production.integrationBranch` |
| `Config/AccessorShadowsMethod` | `warn` | A pinned resource accessor names the same member as a method beside it, so the accessor was renamed. | The resource path, such as `users.billing` |
| `Config/UnknownPublishKey` | `warn` | A `publish` block carries a key that is neither a registry the target supports nor a reserved option such as `signing`, usually a misspelling. | `targets.<target>.publish.<key>` |
| `Config/UnknownPublishOption` | `warn` | A registry entry under `publish` carries a key the configuration schema does not declare. | `targets.<target>.publish.<registry>.<key>` |
| `Config/UnresolvableDestinationRepo` | `warn` | A destination repository is not a GitHub `owner/repo`, so the GitHub-only fields in generated package metadata are left out. | `targets.<target>.destinations.production.repo` |
| `Config/OidcIssuerMismatch` | `warn` | The CLI's configured OAuth issuer rules out an OpenID Connect scheme's browser sign-in, so that sign-in is left out. | The security scheme name |
| `Config/UnusedSecuritySchemeSettings` | `warn` | An `openapi.securitySchemeSettings` key names no OAuth 2.0 or OpenID Connect security scheme in the API description, usually a misspelled scheme id or a scheme the API dropped. Its `resource` and `audience` settings reach no generated client, so clients still sign in but get a token for whichever API the authorization server picks by default. Rename the key to the scheme id, or remove the entry. | The `securitySchemeSettings` key |
| `Config/UnusedRevocationUrl` | `warn` | The CLI's `credentialStore.oauth.revocationUrl`, resolved against every configured environment and server, is not on the origin (scheme, host and port) of any OAuth token endpoint the CLI signs in with. The CLI only revokes at an endpoint on the same origin as the one that issued the token, so `logout` never uses this URL and only deletes the local copy. Not reported when the answer depends on the running CLI, such as with an OpenID Connect scheme. Set an absolute URL on the token endpoint's origin, or remove it. | `targets.cli.credentialStore.oauth.revocationUrl` |
| `Environment/InvalidURL` | `warn` | An `environments` value is not an absolute URL. Generated clients use environments as base URLs, so a relative value produces an SDK that cannot send a request without a manual override. | The environment name |

### Document and references

| Rule | Default | Fires when | Suppression key |
| ---- | ------- | ---------- | --------------- |
| `Document/ReferenceError` | `error` | A `$ref` in the document cannot be resolved, typically an external file or URL that does not exist. Schemas that use it degrade to untyped values. | The `$ref` string |
| `Document/ExtensionReferenceError` | `warn` | The same, for a `$ref` inside a vendor extension the generator does not read. Nothing generated depends on it, so it warns instead of failing. References under `x-scalar-`, `x-fern-`, `x-stainless-`, and `x-speakeasy-` are read by the generator and stay at `error`, except `x-fern-examples`, which the generator does not read. | The `$ref` string |
| `Document/DiscriminatorMappingContradicted` | `warn` | A discriminator maps a value to a variant whose schema pins the discriminator property to a different value. | The schema name |
| `Document/DiscriminatorPropertyAbsent` | `warn` | A discriminator maps several values to a variant that does not declare the discriminator property. | The schema name |
| `Compiler/DeepPointerUnresolved` | `warn` | A deep schema pointer such as `#/components/schemas/Pet/properties/tags` never resolved, so every reference to it becomes an untyped value in every SDK. | The pointer |
| `Compiler/DynamicScopeBudgetExhausted` | `warn` | Binding JSON Schema generics (a `$ref` whose `$defs` declare a `$dynamicAnchor`) would overdraw a compile-wide budget, so that specialization lowers as the plain generic, with untyped items; once a budget is spent, every later one does. | The budget name: `visits`, `nodes`, `sites` or `copies` |

### Schemas and models

| Rule | Default | Fires when | Suppression key |
| ---- | ------- | ---------- | --------------- |
| `Schema/RecursiveMustBeModel` | `warn` | A schema takes part in a `$ref` cycle but is not declared as a model. Cutting the cycle renders the back-reference opaquely, so a declared model is the only way users get a real type at the recursion point. | The component name |
| `Schema/ObjectHasNoProperties` | `info` | An object schema declares no `properties` and no other source of shape, so it becomes an untyped value everywhere. | The schema pointer |
| `Schema/EnumHasOneMember` | `info` | An enum declares exactly one member — usually a constant, or a member list that lost entries somewhere upstream. | The schema pointer |
| `Schema/UnknownType` | `info` | A schema states a `type` the generator does not recognize, and the value falls back to a string. An absent `type` is exempt. | The schema name |
| `Schema/DeprecatedWithoutMessage` | `info` | A schema is marked `deprecated` with no description, so SDK users see a deprecation with no hint about the replacement. | The schema pointer |
| `Model/Recommended` | `info` | A component schema is referenced from three or more places but is not declared as a model, so the type is re-expanded inline at every use. | The component name |
| `Model/Detached` | `warn` | A configured model does not resolve to any compiled schema, so it detaches from the resource that declared it. | The configured model name |
| `Model/DuplicateName` | `warn` | Two configured models backed by different schemas claim the same generated name. The first claimant keeps the name and the rest are renamed, so the SDK ships a numbered type nobody chose. | The generated model name |

### Responses, pagination, and security

For what a pagination scheme declares and how methods bind to one, see [Pagination](pagination.md).

| Rule | Default | Fires when | Suppression key |
| ---- | ------- | ---------- | --------------- |
| `Response/UnsupportedContentType` | `warn` | A configured operation declares a response media type no generated runtime can decode — anything outside JSON, JSON Lines, server-sent events, CSV, plain text, and binary — so the body is handed back as opaque bytes. | `<verb> <path> <status> <contentType>` |
| `Pagination/UnknownScheme` | `error` | A method's `paginated` names a scheme that is not defined in `pagination`. That method degrades to unpaginated. | The endpoint |
| `Pagination/AmbiguousMarker` | `warn` | The document's pagination markers on an operation match more than one configured scheme of the same type. The compiler refuses to guess, so the method stays unpaginated. Set `paginated` explicitly to resolve it. | The endpoint |
| `Pagination/UnusedScheme` | `warn` | A configured pagination scheme is bound to no method. Dead configuration, and usually the remains of a renamed or removed `paginated` reference. | The scheme name |
| `Security/SchemeNotFound` | `warn` | A security requirement references a scheme that is not defined, a required scheme has no client option supplying its credential, or a client option references a scheme that does not exist. | The scheme name |
| `Security/MissingConfiguration` | `info` | Security schemes are defined, but neither the document nor the configuration declares root security, so generated clients default to unauthenticated requests. | `root` |

### README examples

The generated README is code that has to compile, so its configured examples are checked against the methods actually generated.

| Rule | Default | Fires when | Suppression key |
| ---- | ------- | ---------- | --------------- |
| `Readme/UnknownEndpoint` | `warn` | An example's `endpoint` names no method this SDK generates, so the whole entry is dropped and the section falls back to a derived example. | The `exampleRequests` key, such as `default` |
| `Readme/InvalidParameter` | `warn` | An example passes a parameter the endpoint does not declare, or a value its schema rules out. Parameters are rendered exactly as written, so a stale one documents a call the API rejects. An errors section that shows an invalid value on purpose is the case to suppress rather than fix. | `<exampleKey>.<parameter>` |
| `Readme/UnknownResponseProperty` | `warn` | An example prints a response property the endpoint does not return, which ships a README snippet that does not compile in every language that renders it. | `<exampleKey>.<property>` |

### Runtime support and generator health

| Rule | Default | Fires when | Suppression key |
| ---- | ------- | ---------- | --------------- |
| `Unsupported/SignedUploadMethod` | `warn` | A signed-upload method is configured for a target that does not generate signed uploads yet, so that target generates without it. TypeScript, Python, Go, Java, Kotlin, Ruby, PHP and the CLI generate them. | The method's accessor path, such as `files.upload` |
| `Unsupported/WebSocketMethod` | `warn` | A WebSocket method is configured for a target with no WebSocket runtime, so that target's SDK carries the method's event types but nothing that opens a connection. | The endpoint |
| `Unsupported/WebhookSignatureAlgorithm` | `warn` | A webhook helper is signed with an algorithm the C++ target cannot verify. C++ verifies `hmac-sha1`, `hmac-sha256` and `hmac-sha512`, but not `ed25519` or `rsa-sha256`. Each helper is checked on its own scheme, and one the C++ SDK cannot verify gets no method, so you must check those deliveries' signatures yourself; its README lists the helper under "Known gaps". Only C++ is checked. The Python, Go, Java, Kotlin, Ruby and CLI targets verify deliveries with the Standard Webhooks scheme, which checks HMAC-SHA256 signatures (the default `signatureAlgorithm`) whatever algorithm is configured. TypeScript verifies HMAC-SHA256 only, and its verifier throws for any other configured algorithm rather than checking it. This rule reports none of them. | The algorithm, such as `ed25519` |
| `Unsupported/DateTimeFallbackFormats` | `warn` | `dateTimeSettings.fallbackFormats` is configured for a target whose runtime does not apply it. Only the Go, Java, Kotlin, Rust and PHP SDKs try the configured formats when they parse a response date-time; every other target keeps its own parsing rules, so a value only a configured format matches may fail to decode there. TypeScript (unless `dateTimeType` is `Date`) and the CLI keep date-times as strings and are not reported. | The target, such as `python` |
| `Target/InvalidGeneratedCode` | `error` | A target's generated code fails the compile check that runs after it is generated, so that target fails and its files are not written, while every other target is. Only Go has a check today: a generated sample assigning a struct field a type its declaration does not have. This is a generator bug: contact Scalar support. Suppressing it ships code that does not compile. See [After generation](#after-generation). | The declaration that fails, such as `CreateParams.Owner` |
| `Internal/RuleCrash` | `warn` | A diagnostics rule itself failed and was skipped for this build. Your SDK still generates; the finding tells you one check did not run. | The crashing rule's code |

### gRPC

These fire only when the SDK is generated from a proto file.

| Rule | Default | Fires when | Suppression key |
| ---- | ------- | ---------- | --------------- |
| `Grpc/NoMethodsGenerated` | `warn` | A configured target gets no operations at all from the proto input. | `grpc` |
| `Grpc/ServiceNotFound` | `warn` | A configured `grpc.services` key names no service in the proto. | The service name |
| `Grpc/ServiceNotPlaced` | `info` | A service the proto declares is not one the SDK is generated from. | The service name |
| `Grpc/ServicePlacementUnapplied` | `warn` | A configured `grpc.services` block states fields that are not in effect. | `<service> <field> …` |
| `Grpc/TranscodeQueryFormat` | `warn` | The configured query settings do not match what a transcoding gateway parses. | The settings, such as `arrayFormat nestedFormat` |
| `Grpc/UnspellableProcedure` | `warn` | A service or RPC name cannot be written as a config endpoint, so it is skipped. | The service name |
| `Unsupported/GrpcMethod` | `warn` | A gRPC method is left out of a target that has no Connect runtime to send it with. | The endpoint |
| `Unsupported/GrpcPagination` | `warn` | A Connect RPC is configured to paginate, which no generated page runtime can do. | The endpoint |
| `Unsupported/GrpcStreamingMode` | `warn` | A client-streaming or bidirectional RPC is dropped from the generated SDK. | The endpoint |
| `Unsupported/GrpcTranscodeBinding` | `info` | Only the primary `google.api.http` binding of an RPC is generated. | The endpoint |
| `Unsupported/GrpcTranscodeMissing` | `warn` | An RPC cannot be transcoded onto HTTP and falls back to the Connect protocol. | The endpoint |

### AsyncAPI

An AsyncAPI build reports its own rule families — unsupported protocols and schema formats, unconfigured channels, and specification features that are read but not yet generated for. The rules that only fire on an AsyncAPI document are listed on the [AsyncAPI](asyncapi.md#diagnostics) page, and they are graded and suppressed exactly like the rules above.

Rules that read an OpenAPI shape do not run on an AsyncAPI document, so an AsyncAPI build is quieter than an OpenAPI one about the same underlying problem.

## Next steps

- [Configuration](configuration.md#diagnostics) — the `diagnostics` block reference
- [Managing your SDK](managing.md#building) — where build output and logs live
- [AsyncAPI](asyncapi.md#diagnostics) — the AsyncAPI rule family
