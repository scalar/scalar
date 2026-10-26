# Webhooks

A webhook helper is the SDK method a receiving server calls when your API delivers an event. It checks the delivery's signature against your signing secret, then decodes the body into a typed event, so the people integrating with your API do not have to rebuild your signature scheme or hand-write a type for every event.

Webhook helpers are declared, not inferred. The OpenAPI document's top-level `webhooks` describe the events, and a `webhookUnwrap` method in your configuration decides where the helper lives, which events it decodes, and how it verifies them. A configuration with no `webhookUnwrap` method generates nothing from the document's webhooks: no helper, no event types, no verifier. The one place the generator writes such a method for you is the starter configuration it creates for a document that has none; see [Starter configuration](#starter-configuration).

## Start here

Say your API signs each delivery with [Standard Webhooks](https://www.standardwebhooks.com/) and declares two events at the top of its OpenAPI document, each payload carrying a `type` property that names its event and the `widget` it concerns:

```yaml
webhooks:
  widget.created:
    post:
      requestBody:
        content:
          application/json:
            schema: { $ref: '#/components/schemas/WidgetCreatedEvent' }
  widget.deleted:
    post:
      requestBody:
        content:
          application/json:
            schema: { $ref: '#/components/schemas/WidgetDeletedEvent' }
```

Declare a client option to hold the signing secret, and a `webhookUnwrap` method that reads it:

```json
{
  "clientSettings": {
    "opts": {
      "webhook_secret": {
        "type": "string",
        "nullable": true,
        "readEnv": "ACME_WEBHOOK_SECRET"
      }
    }
  },
  "resources": {
    "webhooks": {
      "methods": {
        "parse": {
          "kind": "webhookUnwrap",
          "webhook": {
            "eventTypes": {
              "widget.created": "widget.created",
              "widget.deleted": "widget.deleted"
            },
            "webhookKeyOpt": "webhook_secret"
          }
        }
      }
    }
  }
}
```

That is the whole change. The client reads the secret from `ACME_WEBHOOK_SECRET`, or from the option you pass when constructing it, and the parse method verifies every delivery before decoding it:

<scalar-tabs default="TypeScript">
  <scalar-tab title="TypeScript">

```ts
// `body` is the raw request body as a string; `headers` are the request's headers.
const event = client.webhooks.parse(body, { headers });

switch (event.type) {
  case 'widget.created':
    console.log(event.widget.id);
    break;
  case 'widget.deleted':
    break;
}

// Or check the signature alone, or decode a body you verified elsewhere.
client.webhooks.verifySignature(body, headers);
const unchecked = client.webhooks.parseUnsafe(body);
```

  </scalar-tab>
  <scalar-tab title="Python">

```python
# `payload` is the raw request body; `headers` are the request's headers.
event = client.webhooks.parse(payload, headers=headers)

if event.type == "widget.created":
    print(event.widget.id)

# Or check the signature alone, or decode a body you verified elsewhere.
client.webhooks.verify_signature(payload, headers)
unchecked = client.webhooks.parse_unsafe(payload)
```

Verification runs in the SDK itself, with the standard library alone. The async client has the same methods.

  </scalar-tab>
  <scalar-tab title="Go">

```go
payload, err := io.ReadAll(r.Body)
if err != nil {
    return err
}

event, err := client.Webhooks.Parse(payload, r.Header)
if err != nil {
    return err // the signature did not verify, or the body did not decode
}

switch e := event.AsUnion().(type) {
case acme.WidgetCreatedWebhookEvent:
    fmt.Println(e.Widget.ID)
case acme.WidgetDeletedWebhookEvent:
}

// Or check the signature alone, against an explicit secret and clock.
err = client.Webhooks.VerifySignature(payload, r.Header, secret, time.Now())
```

  </scalar-tab>
  <scalar-tab title="Ruby">

```ruby
# `payload` is the raw request body; `headers` is a Hash of the request's headers.
event = client.webhooks.parse(payload, headers: headers)

case event
when Acme::Models::WidgetCreatedWebhookEvent
  puts event.widget.id
end

# `verify_signature` returns the verified payload as a Hash with symbol keys.
data = client.webhooks.verify_signature(payload: payload, headers: headers)
unchecked = client.webhooks.parse_unsafe(payload)
```

  </scalar-tab>
  <scalar-tab title="Kotlin">

```kotlin
// `headers` is the SDK's `Headers` type, built from the request's headers.
val event = client.webhooks().parse(body, headers, null) // null: use the client's secret

if (event.isWidgetCreated()) {
    println(event.asWidgetCreated().widget().id())
}

client.webhooks().verifySignature(body, headers, null)
val unchecked = client.webhooks().parseUnsafe(body)
```

  </scalar-tab>
  <scalar-tab title="Java">

```java
// `headers` is the SDK's `Headers` type, built from the request's headers.
var event = client.webhooks().parse(body, headers, null); // null: use the client's secret

if (event.isWidgetCreated()) {
    System.out.println(event.asWidgetCreated().widget().id());
}

client.webhooks().verifySignature(body, headers, null);
var unchecked = client.webhooks().parseUnsafe(body);
```

  </scalar-tab>
</scalar-tabs>

<scalar-callout type="warning" icon="phosphor/regular/warning">
  Pass the body exactly as it arrived, before any JSON parsing. The signature covers the raw bytes, so a body that was parsed and re-serialized fails verification even when it holds the same data.
</scalar-callout>

## Declaring a helper

A webhook helper is a method with `"kind": "webhookUnwrap"` and a `webhook` block. It is placed like any other method, and the method key is its name in every target, cased for each language: `resources.webhooks.methods.parse` generates `client.webhooks.parse`. A top-level helper on a resource with another name, such as `resources.events.methods.unwrap`, follows that path in Ruby, Java and Kotlin (`client.events`), while TypeScript, Python and Go still generate it at `client.webhooks`.

### `eventTypes`

`eventTypes` lists the events the helper decodes. Each key is an event's name as the generator derives it: the webhook operation's `operationId` when it has one, otherwise the webhook's key under `webhooks`. Only the keys select events; the value is descriptive, and repeating the event name, as above, is the convention.

| Value | Effect |
| ----- | ------ |
| A map of event names | The helper decodes those events. Its return type is a union over them. |
| `{}` | The helper decodes every webhook the document declares. |
| A map that matches no event | When no helper in the configuration matches any event, the helper decodes every webhook instead of shipping with nothing to decode. Otherwise it decodes nothing. |

When two helpers could claim the same event, one that lists the event explicitly wins over one with an empty map, whatever their order in the configuration. A webhook that no helper claims gets no generated type.

Operation `callbacks` are not part of the event set; only the document's top-level `webhooks` are.

### Scoped helpers

A helper does not have to sit on a top-level `webhooks` resource. Nest it under any resource and it is generated there, so one API can ship a helper per product area:

```json
{
  "resources": {
    "notifications": {
      "subresources": {
        "webhooks": {
          "methods": {
            "parse_alert": {
              "kind": "webhookUnwrap",
              "webhook": {
                "eventTypes": { "alert.created": "alert.created", "alert.resolved": "alert.resolved" },
                "webhookKeyOpt": "webhook_secret"
              }
            }
          }
        }
      }
    }
  }
}
```

That generates `client.notifications.webhooks.parseAlert(...)` in TypeScript, `client.notifications.webhooks.parse_alert(...)` in Python, and `client.Notifications.Webhooks.ParseAlert(...)` in Go. A path segment that names a resource your configuration already generates puts the helper beside that resource's methods; a segment that names none gets a container generated for it. Each scoped helper carries its own event set, signing secret, signature settings and companions.

## The signing secret

`webhookKeyOpt` names the `clientSettings.opts` entry the helper reads its secret from. Declare that option yourself, with a `readEnv`, so you choose the environment variable callers set. Naming it `webhook_secret`, as above, gives it the same name on every client: TypeScript always reads the secret from a `webhookSecret` option, and takes only the `readEnv` of a declared option of that name.

| Target | Set on the client | Read from |
| ------ | ----------------- | --------- |
| TypeScript | `new Acme({ webhookSecret })` | `ACME_WEBHOOK_SECRET` |
| Python | `Acme(webhook_secret=...)` | `ACME_WEBHOOK_SECRET` |
| Go | `option.WithWebhookSecret(...)` | `ACME_WEBHOOK_SECRET` |
| Ruby | `Acme::Client.new(webhook_secret: ...)` | `ACME_WEBHOOK_SECRET` |
| Java, Kotlin | `.webhookSecret(...)` on the client builder | `ACME_WEBHOOK_SECRET`, when the client is built with `fromEnv()` |

Leave `webhookKeyOpt` unset and the helper still verifies. TypeScript, Python, Go and Ruby add a `webhook_secret` option for it, whose environment variable is derived from the SDK name, and not every target derives it the same way. Java and Kotlin add none, and their helper reads no client option, not even a declared `webhook_secret`, so every call has to pass the secret. Naming a declared option is the way to get one option and one variable everywhere.

Every verifying method also takes the secret per call, which wins over the client's. That suits an API that issues a different secret per endpoint or per tenant.

Secrets use the Standard Webhooks format: an optional `whsec_` prefix, then base64. A secret that decodes to nothing is refused rather than used, because an HMAC under an empty key is one anyone can compute.

### Turning verification off

Set `webhookKeyOpt` to `false` for an API that does not sign its deliveries:

```json
{
  "kind": "webhookUnwrap",
  "webhook": {
    "eventTypes": {},
    "webhookKeyOpt": false
  }
}
```

The parse method then only decodes, ignoring any headers it is given, and loses the two companions that verify. Nothing else turns verification off: a helper that leaves `webhookKeyOpt` unset verifies with the default settings below. Verification is a configuration decision, never a call-site one, so a verifying parse method in TypeScript, Python, Go, Ruby or Swift refuses a call without headers rather than skipping the check.

<scalar-callout type="warning" icon="phosphor/regular/warning">
  On Java, Kotlin, PHP and Dart the parse method has a form without headers, for replaying an event you stored after verifying it. That form decodes without checking anything. Pass the headers on every live delivery.
</scalar-callout>

## Signature settings

Verification follows the Standard Webhooks scheme: an HMAC over `{id}.{timestamp}.{body}`, a `v1,`-prefixed base64 signature (any of several space-separated signatures may match), and a timestamp checked against a replay window in both directions. These keys adjust it:

| Key | Default | What it is |
| --- | ------- | ---------- |
| `signatureAlgorithm` | `hmac-sha256` | One of `hmac-sha1`, `hmac-sha256`, `hmac-sha512`, `ed25519`, `rsa-sha256`. |
| `signatureHeader` | `webhook-signature` | The header carrying the signature. |
| `timestampHeader` | derived | The header carrying the unix-seconds timestamp. |
| `toleranceSeconds` | `300` | How far the timestamp may be from the receiver's clock, in seconds. |

The message id and timestamp headers are derived from the signature header's prefix, so `signatureHeader: "x-acme-signature"` reads `x-acme-id` and `x-acme-timestamp`. A signature header that does not end in `-signature` or `_signature` keeps the default `webhook-id` and `webhook-timestamp`. `timestampHeader` overrides the derived timestamp header.

Not every target applies these settings yet:

| Target | Header names and window | Algorithms verified |
| ------ | ----------------------- | ------------------- |
| TypeScript | As configured | `hmac-sha256`. Any other throws an error naming the algorithm when a delivery is verified. |
| Rust | As configured | `hmac-sha256`, `hmac-sha512`. With any other, no verifier is generated. |
| Swift | As configured | `hmac-sha256`, `hmac-sha512`. With any other, the helper only decodes. |
| Dart | As configured | `hmac-sha1`, `hmac-sha256`, `hmac-sha512`. Any other throws `WebhookVerificationException`. |
| C++ | As configured | `hmac-sha1`, `hmac-sha256`, `hmac-sha512`. With any other, the helper is not generated and the build reports `Unsupported/WebhookSignatureAlgorithm`. |
| Python, Go, Ruby, Java, Kotlin, PHP | The Standard Webhooks defaults: `webhook-id`, `webhook-timestamp`, `webhook-signature`, and 300 seconds | HMAC-SHA256, whatever is configured. |

If your API signs with anything other than HMAC-SHA256 under the default headers, check the targets you ship against this table.

## Companion methods

Beside its parse method, a helper generates companion methods:

| Companion | Default | What it does |
| --------- | ------- | ------------ |
| `verify_signature` | On | Checks the signature and throws when it does not verify. It returns nothing, except in Ruby, where it returns the verified payload as a Hash with symbol keys. |
| `parse_unsafe` | On | Decodes the body into the typed event without verifying it, for tests or a body you verified elsewhere. |
| `unwrap` | Off | Verifies the signature, then returns the decoded JSON untyped. |

The two verifying companions, `verify_signature` and `unwrap`, are generated only when the helper verifies; a helper with `webhookKeyOpt: false` gets `parse_unsafe` alone.

`helpers` switches them on or off, or renames them. Names are written in snake_case and re-cased for each target:

```json
{
  "kind": "webhookUnwrap",
  "webhook": {
    "eventTypes": {},
    "webhookKeyOpt": "webhook_secret",
    "helpers": {
      "verifySignature": true,
      "parseUnsafe": "parse_raw",
      "unwrap": true
    }
  }
}
```

| Value | Effect |
| ----- | ------ |
| `true` (the default) | `verify_signature` and `parse_unsafe`. |
| `false` | The parse method alone. |
| An object | Each of `verifySignature`, `parseUnsafe` and `unwrap` is `true` (on, default name), `false` (off), or a string (on, under that name). |

A companion is left out when its name repeats the parse method's or another companion's. The starter configuration names its parse method `unwrap`, so an `unwrap` companion there needs a name of its own. `parseUnsafe` may never take a verifying companion's name (`verify_signature`, `unwrap`, or the name you gave either), because a caller trusting that name would accept unsigned deliveries; it is left out and reported as `Config/WebhookHelperNameUnsafe`. A companion that clashes with another method on the same generated class is resolved by each target's own naming rules, which can leave it out or qualify its name.

Rust keeps its `verify_signature` function even with companions off, because it is the crate's only verifier.

## Naming

### `keyParam`

`keyParam` names the per-call argument that overrides the client's secret, before target casing. It defaults to `key`:

```json
{ "kind": "webhookUnwrap", "webhook": { "eventTypes": {}, "keyParam": "secret" } }
```

TypeScript (`parse(body, { headers, secret })`), Python (`secret=`) and Ruby (`secret:`) use it on the parse method and the verifying companions. Java, Kotlin, PHP and Swift already call the argument `secret`, and the other targets take the key positionally, so they ignore it. The value must be a lowercase snake_case identifier that is not `headers`, `body`, `payload`, a keyword of a generated language, or a name the generated helpers already use.

### `typeName`

`typeName` names the event union the parse method returns, before target casing:

```json
{ "kind": "webhookUnwrap", "webhook": { "eventTypes": {}, "typeName": "ParsedWebhookEvent" } }
```

Without it, each target keeps its own default: some name the union after the method (`parse_alert` returns `ParseAlertWebhookEvent`), others name a top-level helper's union `ParsedWebhookEvent` whatever the method is called, and Rust's is `WebhookEvent`. Set it when you rename the parse method of an SDK you have already published, so the type your users import keeps its name.

The name must end in `Event`. One that a model, a webhook event's own type, another helper's union or a WebSocket event type already uses is ignored, with a `Config/WebhookTypeNameConflict` warning, and the helper keeps its default. Go always keeps its default names.

### Event types

Each event gets its own type, named after the event with `WebhookEvent` appended: `widget.created` generates `WidgetCreatedWebhookEvent`. An event whose `operationId` already ends in `Webhook`, such as `widgetCreatedWebhook`, does not repeat the word.

### Other keys

| Key | What it is |
| --- | ---------- |
| `summary`, `description` | Doc text for the generated parse method. PHP, Swift, Dart and C++ render it. |
| `discriminator` | The payload property that tells the events apart, such as `type`. Swift, Dart and C++ decode the union by it; without it they look for a property every payload pins to a distinct value, trying `type` first. |

## What gets generated

| Target | Parse method | Companions | Verifier |
| ------ | ------------ | ---------- | -------- |
| TypeScript | `client.webhooks.parse(body, { headers, key? })` | `verifySignature(body, headers, key?)`, `parseUnsafe(body)`, `unwrap(body, headers, key?)` | Built in, no dependency |
| Python | `client.webhooks.parse(payload, *, headers, key=None)`, sync and async | `verify_signature(payload, headers, *, key=None)`, `parse_unsafe(payload)`, `unwrap(...)` | Built in, standard library only |
| Go | `client.Webhooks.Parse(payload, headers, opts...)` | `VerifySignature(payload, headers, secret, now)`, `ParseUnsafe(payload)`, `Unwrap(payload, headers, opts...)` | Built in, standard library only |
| Java, Kotlin | `parse(body, headers, secret)`, `parse(UnwrapWebhookParams)`, and `parse(body)`, which only decodes | `verifySignature(...)`, `parseUnsafe(body)`, `unwrap(...)` returning `JsonValue` | Built in, JDK only |
| Ruby | `client.webhooks.parse(payload, headers:, key: client's secret)` | `verify_signature(payload:, headers:, key: nil)`, `parse_unsafe(payload)`, `unwrap(payload, headers:, key: nil)` | Built in, no gem |
| PHP | `parse(string $body, ?array $headers = null, ?string $secret = null)`, which verifies only when given headers | `verifySignature($body, $headers, $secret)`, `parseUnsafe($body)`, `unwrap(...)` | Built in, no dependency |
| Rust | `<Union>::parse(event_type, payload)`, which only decodes | Free functions in the `webhooks` module: `verify_signature(payload, headers, secret)`, `verify_signature_at(...)`, `parse_unsafe(event_type, payload)`, `unwrap(payload, headers, secret)` | `hmac` and `sha2` crates |
| Swift | `parse(_ payload: Data, headers:, secret:) async throws` | `verifySignature(...)`, `parseUnsafe(_:)`, `unwrap(...)` returning `JSONValue` | Built in, no dependency |
| Dart | `parse(String body, {required headers, secret})`; `headers: null` only decodes | Not generated yet | `package:crypto` |
| C++ | `parse(body, headers)`, `parse(body, headers, secret)`, and `parse_unverified(body)`, which only decodes | Not generated yet | Built in |
| C# | Not generated: the webhook service is an empty accessor | None | None |

Method names above follow the helper in the Start here example; yours follow your method key. The event types are generated on every target, C# included, so a C# receiver can deserialize a delivery into them after checking its signature itself.

In Rust, the parse method decodes by the event-type string you pass, because the union is told apart from outside the payload: call `verify_signature` first, then `parse`.

## README

The generated README for TypeScript, Python, Go, Java, Kotlin and Ruby includes a `## Webhooks` section when the SDK has a webhook helper the client reaches directly, such as `client.webhooks`. A helper that only exists under another resource is documented where each target puts it on the client: TypeScript always also generates it at `client.webhooks`; Python does too, unless the SDK already has a `webhooks` resource somewhere else, in which case the helper stays under its parent and the section is left out; and Ruby documents it at its own path (`client.notifications.webhooks`). Go, Java and Kotlin reach it only through its parent resource, so they leave it to the API reference. It opens with a short explanation that is the same in every target: pass the raw, unparsed request body together with the request headers, because the signature covers the body as it arrived. Then comes a snippet calling the parse method, where the signing secret comes from (the client option and its environment variable, or, on a Java or Kotlin SDK whose helper reads none, that each call passes it), and a bullet for each companion the helper generates. A helper with `webhookKeyOpt: false` gets an explanation that says it only decodes, and that deliveries must be checked some other way.

## Starter configuration

When a build has no configuration and the document declares top-level `webhooks`, the starter configuration the generator writes includes a `webhooks` resource with one `unwrap` method whose `eventTypes` lists every event. It leaves `webhookKeyOpt` unset, so verification is on with the default settings, reading the secret from the option most targets add for it (Java and Kotlin take it per call; see [The signing secret](#the-signing-secret)). Name the secret option yourself, as in [Start here](#start-here), before you publish.

If the document already has a path-derived `webhooks` resource, the starter puts the helper under a different key so both survive.

## Importing a Fern project

A Fern project's webhook settings map onto `webhookUnwrap` methods:

| Fern | Scalar |
| ---- | ------ |
| `x-fern-webhook-signature` at the document root | `signatureAlgorithm`, `signatureHeader`, `timestampHeader` and `toleranceSeconds` on the starter `unwrap` method |
| `x-fern-webhook-signature` on one webhook | A further `webhookUnwrap` method, `unwrap_<first event>`, whose `eventTypes` claims the webhooks sharing those settings |
| `x-fern-webhook: true` on a `paths` operation | The operation is dropped from the SDK, so no client method POSTs to your users' receivers |

A signature block whose algorithm has no Scalar value, such as HMAC-SHA384 or ECDSA, is dropped whole and the helper keeps the default settings. A webhook with no signature block at all still verifies with the defaults; set `webhookKeyOpt: false` yourself if your API does not sign it. An `x-fern-webhook` operation's payload type is not recovered, so move such operations into the OpenAPI 3.1 top-level `webhooks` block. See [OpenAPI Extensions](openapi-extensions.md#imported-vendor-extensions).

## Diagnostics

| Code | Severity | What it means |
| ---- | -------- | ------------- |
| `Config/WebhookTypeNameConflict` | `warn` | A helper's `typeName` does not end in `Event`, or names a type the SDK already declares. The helper keeps its default union name. |
| `Config/WebhookHelperNameUnsafe` | `warn` | A helper's `helpers.parseUnsafe` takes a verifying companion's name, so the decoder that skips verification is not generated. |
| `Unsupported/WebhookSignatureAlgorithm` | `warn` | The C++ SDK cannot verify a helper's `signatureAlgorithm`, so it generates no method for that helper. |

See [Diagnostics](diagnostics.md) for how findings are graded, suppressed, and used to fail a build.

## Related

- [Configuration](configuration.md) — `resources`, methods, and the `clientSettings.opts` entry that holds the secret
- [OpenAPI Extensions](openapi-extensions.md) — the Fern extensions a webhook import reads
- [Diagnostics](diagnostics.md) — what a build reports about a webhook helper
