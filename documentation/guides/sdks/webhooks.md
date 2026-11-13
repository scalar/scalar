# Webhooks

A webhook helper is the SDK method a receiving server calls when your API delivers an event. It checks the delivery's signature against your signing secret, then decodes the body into a typed event, so the people integrating with your API do not have to rebuild your signature scheme or hand-write a type for every event.

Webhook helpers are declared, not inferred. The OpenAPI document's top-level `webhooks` describe the events, and a `webhookUnwrap` method in your configuration decides where the helper lives, which events it decodes, and how it verifies them. A configuration with no `webhookUnwrap` method generates nothing from the document's webhooks: no helper, no event types, no verifier. The one place the generator writes such a method for you is the starter configuration it creates for a document that has none; see [Starter configuration](#starter-configuration). The [configuration reference](#configuration-reference) at the end lists every key a helper takes.

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

That is the whole change. The client reads the secret from `ACME_WEBHOOK_SECRET`, or from the option you pass when constructing it (see [The signing secret](#the-signing-secret) for each target), and the parse method verifies every delivery before decoding it:

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
  <scalar-tab title="PHP">

```php
// `$body` is the raw request body; `$headers` is an array of the request's headers.
$event = $client->webhooks->parse($body, $headers);

if ($event instanceof \Acme\Webhooks\WidgetCreatedWebhookEvent) {
    echo $event->widget->id;
}

$client->webhooks->verifySignature($body, $headers);
$unchecked = $client->webhooks->parseUnsafe($body);
```

  </scalar-tab>
  <scalar-tab title="Rust">

```rust
use acme::{webhooks, WebhookEvent};

// `body` is the raw request body; `headers` is its `http::HeaderMap`.
// Rust reads no client option for the secret, so pass it on every call.
webhooks::verify_signature(&body, &headers, &secret)?;

// `event_type` names the event: the enum is told apart from outside the payload.
match WebhookEvent::parse(event_type, &body)? {
    WebhookEvent::WidgetCreated(created) => println!("{}", created.widget.id),
    _ => {}
}
```

  </scalar-tab>
  <scalar-tab title="Swift">

```swift
// `body` is the request body as received (`Data`); `headers` is a `[String: String]`.
let event = try await client.webhooks.parse(body, headers: headers)

switch event {
case .widgetCreated(let created):
    print(created.widget.id)
case .widgetDeleted, .undocumented:
    break
}

try await client.webhooks.verifySignature(body, headers: headers)
let unchecked = try client.webhooks.parseUnsafe(body)
```

  </scalar-tab>
  <scalar-tab title="Dart">

```dart
// `body` is the raw request body as a String; `headers` is a Map of the request's headers.
final event = client.webhooks.parse(body, headers: headers);

if (event is ParseWebhookEventWidgetCreated) {
  print(event.value.widget.id);
}
```

  </scalar-tab>
  <scalar-tab title="C++">

```cpp
// `body` is the raw request body; copy every request header into `headers`.
acme::Headers headers;
for (const auto &field : request.headers) {
  headers.add(field.name, field.value);
}

auto event = client.webhooks().parse(body, headers);
if (const auto *created = event.widget_created()) {
  std::cout << created->widget.id << '\n';
}

// Or decode a body you verified elsewhere.
auto unchecked = client.webhooks().parse_unverified(body);
```

  </scalar-tab>
</scalar-tabs>

<scalar-callout type="warning" icon="phosphor/regular/warning">
  Pass the body exactly as it arrived, before any JSON parsing. The signature covers the raw bytes, so a body that was parsed and re-serialized fails verification even when it holds the same data.
</scalar-callout>

## Declaring a helper

A webhook helper is a method with `"kind": "webhookUnwrap"` and a `webhook` block. It is placed like any other method, and the method key is its name in every target, cased for each language: `resources.webhooks.methods.parse` generates `client.webhooks.parse`. A top-level helper on a resource with another name, such as `resources.events.methods.unwrap`, follows that path in Ruby, Java, Kotlin, PHP, Swift, Dart and C++ (`client.events`), while TypeScript, Python and Go still generate it at `client.webhooks`. Rust has no webhook method on the client: its helper is a set of free functions in the crate's `webhooks` module.

Go and Ruby also keep a `Parsed` (Go) or `parsed` (Ruby) alias beside a top-level parse method of any other name, which calls it with the same arguments; Ruby marks it deprecated.

### `eventTypes`

`eventTypes` lists the events the helper decodes. Each key is an event's name as the generator derives it: the webhook operation's `operationId` when it has one, otherwise the webhook's key under `webhooks`. Only the keys select events; the value is descriptive, and repeating the event name, as above, is the convention.

| Value | Effect |
| ----- | ------ |
| A map of event names | The helper decodes those events. Its return type is a union over them. |
| `{}` | The helper decodes every webhook the document declares. |
| A map that matches no event | When no helper in the configuration matches any event, some targets decode every webhook instead of shipping the helper with nothing to decode, while others generate nothing for it (PHP generates no webhook service). Use `{}` to decode every webhook in every target. Otherwise the key selects no event, and what a target generates for a helper left with none varies. Each key that names no event is reported with `Config/WebhookUnknownEventType`. |

When two helpers could claim the same event, one that lists the event explicitly wins over one with an empty map, whatever their order in the configuration. A webhook that no helper claims gets no generated type, except in Rust, whose event enum has an arm for every top-level webhook once the configuration has any helper.

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

That generates `client.notifications.webhooks.parseAlert(...)` in TypeScript, `client.notifications.webhooks.parse_alert(...)` in Python, and `client.Notifications.Webhooks.ParseAlert(...)` in Go. A segment that names no resource your configuration generates gets a container generated for it. In Go, a path that names a resource your configuration already generates puts the helper beside that resource's methods; in TypeScript, and in Python unless the helper's leaf is itself a generated `webhooks` resource, such a helper is generated on `client.webhooks` instead, and the top-level webhooks module verifies it (see [Signature settings](#signature-settings)). Each scoped helper carries its own event set, signing secret, signature settings and companions. Rust is the exception: it generates one `webhooks` module for the crate, whose event enum and companions follow the top-level helper's settings (a scoped one's when there is no top-level helper), and whose event enum decodes every top-level webhook the document declares, whatever each helper's `eventTypes` selects. Signature settings stay per helper: when every helper signs the same way, the module's `verify_signature` checks all of them, and when they differ, `verify_signature` checks only the top-level helper's deliveries and every other helper gets a module of its own, such as `webhooks::parse_alert::verify_signature` (see [Signature settings](#signature-settings)).

## The signing secret

`webhookKeyOpt` names the `clientSettings.opts` entry the helper reads its secret from. Declare that option yourself, with a `readEnv`, so you choose the environment variable callers set. Naming it `webhook_secret`, as above, gives it the same name on every client: TypeScript always reads the secret from a `webhookSecret` option, and takes only the `readEnv` of a declared option of that name.

| Target | Set on the client | Read from |
| ------ | ----------------- | --------- |
| TypeScript | `new Acme({ webhookSecret })` | `ACME_WEBHOOK_SECRET` |
| Python | `Acme(webhook_secret=...)` | `ACME_WEBHOOK_SECRET` |
| Go | `option.WithWebhookSecret(...)` | `ACME_WEBHOOK_SECRET` |
| Ruby | `Acme::Client.new(webhook_secret: ...)` | `ACME_WEBHOOK_SECRET` |
| Java, Kotlin | `.webhookSecret(...)` on the client builder | `ACME_WEBHOOK_SECRET` (or the `acme.webhookSecret` system property), when the client is built with `fromEnv()` |
| PHP | `new Client(webhookSecret: ...)` | `ACME_WEBHOOK_SECRET` |
| Swift | `AcmeClient(webhookSecret: ...)`, or `Configuration.webhookSecret` | `ACME_WEBHOOK_SECRET`, on macOS and Linux |
| Dart | `AcmeClient(webhookSecret: ...)` | `ACME_WEBHOOK_SECRET`, when the client is built with `AcmeClient.fromEnvironment()` |
| C++ | `ClientOptions::webhook_secret` | `ACME_WEBHOOK_SECRET`, when the option is unset |

Ruby resolves the secret each time a verifying method is called: a secret passed to the constructor wins, then the environment variable as it is at call time, then the value the client read when it was built, so a secret rotated in the environment takes effect without a new client. Rust reads no client option at all; its verifying functions take the secret as an argument. C# generates no helper that would read it, so it declares no client setting for the option a helper's `webhookKeyOpt` names, unless the config also sends that option with requests or a signed URL signs with it (see [What gets generated](#what-gets-generated)).

Leave `webhookKeyOpt` unset and the helper still verifies. TypeScript, Python, Go, Ruby, PHP, Swift, Dart and C++ add a `webhook_secret` option for it, whose environment variable is derived from the SDK name, and not every target derives it the same way. Java and Kotlin add none, and their helper reads no client option, not even a declared `webhook_secret`, so every call has to pass the secret. Naming a declared option is the way to get one option and one variable everywhere.

Every verifying method also takes the secret per call, which wins over the client's. That suits an API that issues a different secret per endpoint or per tenant.

Secrets use the Standard Webhooks format: an optional `whsec_` prefix, then base64. A secret that decodes to nothing is refused rather than used, because an HMAC under an empty key is one anyone can compute.

### `bytesKey`

`bytesKey` says how Python reads a per-call key passed as `bytes`. With `raw`, the default, the bytes are the HMAC key itself, as the Standard Webhooks library reads them. With `utf8`, the parse method decodes the bytes as UTF-8 and reads the text the way it reads a `str` key: an optional `whsec_` prefix is stripped and the rest is base64-decoded. The verifying companions (`verify_signature`, `unwrap`) keep using `bytes` as the raw key.

```json
{ "kind": "webhookUnwrap", "webhook": { "eventTypes": {}, "bytesKey": "utf8" } }
```

Set `utf8` when your users hand over the secret your dashboard shows as bytes, for example read from a file or from `os.environb`. Only Python tells a `bytes` key from a string one, so the other targets ignore the setting. It is experimental.

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

The parse method then only decodes, ignoring any headers it is given, and loses the two companions that verify. It keeps its arguments, so call sites do not change; in TypeScript, Python, Ruby, PHP and Dart, passing it a secret throws rather than being silently ignored. Swift is the exception: its parse method still verifies, against a `secret` that every call then has to pass, because the configuration holds none, and it throws `WebhookError` with code `missingSecret` without one.

Nothing else turns verification off: a helper that leaves `webhookKeyOpt` unset verifies with the default settings below. Verification is a configuration decision, never a call-site one, so a verifying parse method in TypeScript, Python, Go, Ruby, Swift or C++ refuses a call without headers rather than skipping the check.

<scalar-callout type="warning" icon="phosphor/regular/warning">
  Some targets have a form of the parse method without headers, for replaying an event you stored after verifying it. On Java and Kotlin, `parse(body)` decodes without checking anything, and so does `parse(UnwrapWebhookParams)` without headers when neither the params nor the client hold a secret. On PHP and Dart, a parse call without headers decodes unchecked when no secret is available, and throws when one is. Pass the headers on every live delivery.
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
| TypeScript | As configured; helpers without a module of their own, such as those on the top-level `webhooks` resource, share one scheme | `hmac-sha256`. With any other, every verifying method throws `WebhookVerificationError` naming the algorithm, so a receiver that catches refused deliveries catches it too, and the message names the decode-only `parseUnsafe` (under its configured name, if renamed) for a delivery you checked yourself. |
| Rust | As configured, per helper | `hmac-sha256`, `hmac-sha512`. With any other, that helper gets no verifier, and no other helper's verifier checks its deliveries. |
| Swift | As configured | `hmac-sha256`, `hmac-sha512`. With any other, the parse method always throws `WebhookError` with code `unsupportedSignatureScheme`, the verifying companions are not generated, and `parseUnsafe` decodes a delivery you checked yourself. |
| Python | As configured; helpers without a module of their own, such as those on the top-level `webhooks` resource or under a real resource, share one scheme | `hmac-sha1`, `hmac-sha256`, `hmac-sha512`. With any other, the parse method, `verify_signature` and `unwrap` raise `WebhookVerificationError` naming the algorithm for every delivery, and `parse_unsafe` decodes a delivery you checked yourself. |
| Dart | As configured | `hmac-sha1`, `hmac-sha256`, `hmac-sha512`. With any other, a parse call with headers throws `WebhookVerificationException`, and `headers: null` decodes a delivery you checked yourself. |
| C++ | As configured | `hmac-sha1`, `hmac-sha256`, `hmac-sha512`. With any other, the helper is not generated and the build reports `Unsupported/WebhookSignatureAlgorithm`. |
| Go | As configured, per helper; helpers without a module of their own, such as those on the top-level `webhooks` resource, share one scheme | `hmac-sha1`, `hmac-sha256`, `hmac-sha512`. With any other, the methods are still generated, and every verifying one returns an error that matches `ErrNoMatchingSignature`, names the algorithm as unsupported and points at `ParseUnsafe`, which decodes a delivery you checked yourself. |
| Ruby | As configured | `hmac-sha1`, `hmac-sha256`, `hmac-sha512`. With any other, the parse method and the verifying companions keep their signatures but always raise `Errors::WebhookVerificationError` naming the algorithm, and `parse_unsafe` decodes a delivery you checked yourself. |
| PHP | As configured, each helper with its own | `hmac-sha1`, `hmac-sha256`, `hmac-sha512`. With any other, the parse method throws `WebhookException` naming the algorithm whenever headers or a secret are available, `verifySignature` and `unwrap` always throw it, and `parseUnsafe` (or, when it is turned off, a parse call without headers on a client with no webhook secret) decodes a delivery you checked yourself. |
| Java, Kotlin | As configured, each helper with its own | `hmac-sha1`, `hmac-sha256`, `hmac-sha512`, with the JDK alone. With any other, every method is still generated and no secret is needed: every method that is given a delivery's headers throws the SDK's webhook exception, whose reason (its message in Kotlin, its cause in Java) names the algorithm as unsupported (`verifySignature` and `unwrap` given params without headers throw for the missing headers instead), and `parseUnsafe` (under its configured name, if renamed) decodes a delivery you checked yourself. |

If your API signs with anything other than HMAC-SHA256 under the default headers, check the targets you ship against this table. Generation reports every gap in it for the targets you generate: an algorithm a target cannot verify as `Unsupported/WebhookSignatureAlgorithm`, and header names or a window it ignores as `Unsupported/WebhookSignatureSettings`.

In Rust, helpers that sign differently are verified apart. The free `webhooks::verify_signature` and `verify_signature_at`, and `unwrap` when configured, keep checking the top-level helper's deliveries (none are generated when that helper uses an algorithm Rust cannot verify, or turns verification off while the remaining helpers still sign differently; an opted-out helper is not counted when comparing schemes). Each other helper gets a module named after its method, holding its verifier (named by its `helpers.verifySignature`), `verify_signature_at`, and an `unwrap` when its `helpers.unwrap` asks for one: `parse_alert` generates `webhooks::parse_alert::verify_signature(payload, headers, secret)`. When an earlier helper's module, one of the file's own items (such as `unwrap`) or a reserved name already takes the method name, the module adds the helper's resource path (`notifications_webhooks_parse_alert`). When every helper signs the same way, there are no per-helper modules.

## Refused deliveries

A delivery that fails verification, because a signed header is missing or malformed, its timestamp is outside the window, or no signature matches, is refused with an error a receiver can catch on its own:

| Target | A refused delivery | A missing or unusable secret |
| ------ | ------------------ | ---------------------------- |
| TypeScript | `WebhookVerificationError`, exported from the package root; it extends the SDK's base error (`AcmeError`) | A plain `Error`. `verifySignature` and `unwrap` also throw a plain `Error` for a signed header they find missing before verifying. |
| Python | `WebhookVerificationError`, exported from the package root and a subclass of the SDK's base error. The parse method raises its subclass `WebhookMissingHeadersError`, which is also a `ValueError`, for a missing or empty signed header. `verify_signature` and `unwrap` raise a plain `ValueError` for a signed header they cannot find; an empty one in a `dict` or other mapping reaches the verifier and raises `WebhookMissingHeadersError`, as the parse method does. | `ValueError` |
| Go | An error that matches exactly one of the root package's `ErrRequiredHeaders`, `ErrInvalidHeaders`, `ErrNoMatchingSignature`, `ErrMessageTooOld` and `ErrMessageTooNew` with `errors.Is` | An error that matches none of them |
| Ruby | `Acme::Errors::WebhookVerificationError`, a subclass of `Acme::Errors::Error` | `ArgumentError` |
| Java | `AcmeWebhookException("Could not verify webhook event signature")`, with the reason on its cause | `AcmeException` when no secret is set, `AcmeWebhookException` when it is not valid. `parse(UnwrapWebhookParams)` with headers throws `IllegalStateException` when no secret is set and `IllegalArgumentException` when it is not valid. |
| Kotlin | `AcmeWebhookException`, with the reason as its message. Every method except `parse(UnwrapWebhookParams)` throws `AcmeInvalidDataException` naming a missing signed header; that one throws `AcmeWebhookException`. | As Java |
| PHP | `Acme\Core\Exceptions\WebhookException` | `WebhookException` |
| Rust | `Error::Webhook(WebhookVerificationError)`, whose `kind()` is `MissingHeader`, `InvalidHeader`, `InvalidSignature` or `OutsideTolerance` | `Error::Config` |
| Swift | `WebhookError`, whose `code` names the check: `missingHeader`, `invalidHeader`, `timestampOutsideTolerance` or `signatureMismatch`, so `catch WebhookError.signatureMismatch` matches one | `WebhookError` with code `missingSecret` or `invalidSecret` |
| Dart | `WebhookVerificationException`, a subclass of `AcmeException` | `WebhookVerificationException` |
| C++ | `acme::WebhookVerificationError`, a subclass of `acme::Error` | `acme::WebhookVerificationError` |

## Companion methods

Beside its parse method, a helper generates companion methods:

| Companion | Default | What it does |
| --------- | ------- | ------------ |
| `verify_signature` | On | Checks the signature and throws when it does not verify. It returns nothing, except in Ruby, where it returns the verified payload as a Hash with symbol keys. |
| `parse_unsafe` | On | Decodes the body into the typed event without verifying it, for tests or a body you verified elsewhere. |
| `unwrap` | Off | Verifies the signature, then returns the decoded JSON untyped. |

The two verifying companions, `verify_signature` and `unwrap`, are generated only when the helper verifies; a helper with `webhookKeyOpt: false` gets `parse_unsafe` alone.

Dart and C++ generate no companions and ignore `helpers`. C++ instead always pairs each parse method with a decode-only `<method>_unverified`, and an SDK whose helper verifies ships `acme::verify_webhook_signature(body, headers, options)`, which checks a signature on its own.

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

Rust keeps each helper's `verify_signature` function even with companions off, because it is the only verifier that helper has: the top-level helper's in `webhooks`, and, when helpers sign differently, each other helper's in its own module (see [Signature settings](#signature-settings)). A helper signed with an algorithm Rust cannot verify has no verifier at all.

## Naming

### `keyParam`

`keyParam` names the per-call argument that overrides the client's secret, before target casing. It defaults to `key`:

```json
{ "kind": "webhookUnwrap", "webhook": { "eventTypes": {}, "keyParam": "secret" } }
```

TypeScript (`parse(body, { headers, secret })`), Python (`secret=`) and Ruby (`secret:`) use it on the parse method and the verifying companions. Java, Kotlin, PHP, Swift and Dart already call the argument `secret`, and the other targets take the key positionally (Go's parse method through `option.WithWebhookSecret`), so they ignore it. The value must be a lowercase snake_case identifier that is not `headers`, `body`, `payload`, a keyword of a generated language, or a name the generated helpers already use.

### `typeName`

`typeName` names the event union the parse method returns, before target casing:

```json
{ "kind": "webhookUnwrap", "webhook": { "eventTypes": {}, "typeName": "ParsedWebhookEvent" } }
```

Without it, each target keeps its own default: some name the union after the method (`parse_alert` returns `ParseAlertWebhookEvent`), others name a top-level helper's union `ParsedWebhookEvent` whatever the method is called, and Rust's is `WebhookEvent`. Set it when you rename the parse method of an SDK you have already published, so the type your users import keeps its name.

The name must end in `Event`. One that a model, a webhook event's own type, another helper's union or a WebSocket event type already uses is ignored, with a `Config/WebhookTypeNameConflict` warning, and the helper keeps its default. Go always keeps its default names.

### Event types

Each event gets its own type, named after the event with `WebhookEvent` appended: `widget.created` generates `WidgetCreatedWebhookEvent`. An event whose `operationId` already ends in `Webhook`, such as `widgetCreatedWebhook`, does not repeat the word. Rust names no type of its own for a payload that references a component schema: its event enum's arm holds that schema's model (`WidgetCreatedEvent` in the Start here example).

### Other keys

| Key | What it is |
| --- | ---------- |
| `summary`, `description` | Doc text for the helper. Swift, Dart and C++ render it on the parse method, preferring `summary` when both are set; PHP renders it on the event union's class, preferring `description`. Either one also replaces the `summary` or `description` of every webhook the helper claims, so it becomes the doc text of those events' types in the targets that document them. |
| `discriminator` | The payload property that tells the events apart, such as `type`. Python, Java, Kotlin, Swift, Dart and C++ decode the union by it; without it they look for a property every payload pins to a distinct value, which all but Python try `type` for first. |

## What gets generated

| Target | Parse method | Companions | Verifier |
| ------ | ------------ | ---------- | -------- |
| TypeScript | `client.webhooks.parse(body, { headers, key? })` | `verifySignature(body, headers, key?)`, `parseUnsafe(body)`, `unwrap(body, headers, key?)` | Built in, no dependency |
| Python | `client.webhooks.parse(payload, *, headers, key=None)`, sync and async | `verify_signature(payload, headers, *, key=None)`, `parse_unsafe(payload)`, `unwrap(...)` | Built in, standard library only; each helper checks its own `hmac-sha1`, `hmac-sha256` or `hmac-sha512` scheme |
| Go | `client.Webhooks.Parse(payload, headers, opts...)` | `VerifySignature(payload, headers, secret, now)`, `ParseUnsafe(payload)`, `Unwrap(payload, headers, opts...)` | Built in, standard library only |
| Java, Kotlin | `parse(body, headers, secret)`, `parse(UnwrapWebhookParams)`, and `parse(body)`, which only decodes | `verifySignature(...)`, `parseUnsafe(body)`, `unwrap(...)` returning `JsonValue` | Built in, JDK only |
| Ruby | `client.webhooks.parse(payload, headers:, key: nil)`, where `nil` resolves the client's secret | `verify_signature(payload:, headers:, key: nil)`, `parse_unsafe(payload)`, `unwrap(payload, headers:, key: nil)` | Built in, no gem |
| PHP | `parse(string $body, ?array $headers = null, ?string $secret = null)`, which verifies whenever headers are passed or a secret is available | `verifySignature($body, $headers, $secret)`, `parseUnsafe($body)`, `unwrap(...)` | Built in, no dependency |
| Rust | `<Union>::parse(event_type, payload)`, which only decodes | Free functions in the `webhooks` module: `verify_signature(payload, headers, secret)`, `verify_signature_at(...)`, `parse_unsafe(event_type, payload)`, `unwrap(payload, headers, secret)`; the verifying three only for `hmac-sha256` and `hmac-sha512`, and in a module per helper (`webhooks::<helper>::verify_signature`) when helpers sign differently | `hmac` and `sha2` crates, only when a verifier is generated |
| Swift | `parse(_ payload: Data, headers:, secret:) async throws`, and the same taking a `String` | `verifySignature(...)`, `parseUnsafe(_:)`, `unwrap(...)` returning `JSONValue` | Built in, no dependency |
| Dart | `parse(String body, {required headers, secret})`; `headers: null` decodes without checking only when no secret is available | Not generated | `package:crypto` |
| C++ | `parse(body, headers)`, `parse(body, headers, secret)`, and `parse_unverified(body)`, which only decodes | Not generated | Built in |
| C# | Not generated: the webhook service is an empty accessor, and the README's "Known gaps" section says so | None | None |

Method names above follow the helper in the Start here example; yours follow your method key. The event types are generated on every target, C# included, so a C# receiver can deserialize a delivery into them after checking its signature itself. C# declares no `WebhookSecret` client setting for the signing key, since nothing in the SDK would read it, unless the config also sends that option with requests or a signed URL signs with it. The CLI target generates no command for a webhook helper.

In Rust, the parse method decodes by the event-type string you pass, because the union is told apart from outside the payload: call `verify_signature` first, then `parse`.

## README

The generated README for TypeScript, Python, Go, Java, Kotlin, Ruby, Swift and C++ includes a `## Webhooks` section when the SDK has a webhook helper the client reaches directly, such as `client.webhooks`. The PHP, Rust, Dart and C# READMEs have none; the C# README instead lists, under "Known gaps", the type each helper with events decodes into, and for a signed helper tells the reader to verify deliveries before deserializing them. A helper that only exists under another resource is documented where each target puts it on the client: TypeScript always also generates it at `client.webhooks`; Python does too, unless the SDK already has a `webhooks` resource somewhere else, in which case the helper stays under its parent and the section is left out; Ruby documents it at its own path (`client.notifications.webhooks`); and C++ lists every helper at its own path (`client.notifications().webhooks()`). Go, Java, Kotlin and Swift reach it only through its parent resource, so they leave it to the API reference.

Except in C++, the section opens with a short explanation that is the same in every target: pass the raw, unparsed request body together with the request headers, because the signature covers the body as it arrived. Then comes a snippet calling the parse method, where the signing secret comes from (the client option and its environment variable, or, on a Java or Kotlin SDK whose helper reads none, that each call passes it), and a bullet for each companion the helper generates. A helper with `webhookKeyOpt: false` gets an explanation that says it only decodes, and that deliveries must be checked some other way; in Swift, whose parse method still verifies, it says to pass `secret` on every call. In Go, Java, Kotlin, Python, Ruby and Swift, a helper signed with `ed25519` or `rsa-sha256` gets the decode-only explanation too, with a note naming the algorithm the SDK cannot verify and a snippet that decodes with the helper's `parseUnsafe` method when it has one (Swift leaves the section out when the helper has none). TypeScript shows the verifying call, which throws for such a helper. The C++ section is one paragraph covering every webhook method (verification, the client's secret and its environment variable, the error thrown, the decode-only twin), a snippet, and the union each method returns.

## Starter configuration

When a build has no configuration and the document declares top-level `webhooks`, the starter configuration the generator writes includes a `webhooks` resource with one `unwrap` method whose `eventTypes` lists every event. It leaves `webhookKeyOpt` unset, so verification is on with the default settings, reading the secret from the option most targets add for it (Java, Kotlin and Rust take it per call; see [The signing secret](#the-signing-secret)). Name the secret option yourself, as in [Start here](#start-here), before you publish.

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
| `Config/WebhookUnknownEventType` | `warn` | An `eventTypes` key names no webhook event in the document, so it selects nothing. The message lists the document's event names and suggests the one the key most likely meant, such as the `operationId` of the webhook the key names by its `webhooks` key. |
| `Config/WebhookHelperNoEvents` | `warn` | A helper matches no webhook event, such as an empty `eventTypes` map on a document with no top-level webhooks, so it has nothing to decode. |
| `Unsupported/WebhookSignatureAlgorithm` | `warn` | A target cannot verify a helper's `signatureAlgorithm`. The message says what that SDK does instead, per the table in [Signature settings](#signature-settings): C++ generates no method for the helper, TypeScript, Python, Swift, Ruby, Java and Kotlin throw, Go returns an error from every verifying method, Dart throws when given headers, PHP whenever it has headers or a secret, and Rust generates no verifier for the helper. |
| `Unsupported/WebhookSignatureSettings` | `warn` | A helper configures signature header names or a `toleranceSeconds` that a target does not apply to it. Every target with a webhook helper reads the configured values, so nothing is reported yet; TypeScript, Python and Go apply one helper's header names to every helper their top-level webhooks module serves, with the narrowest window among them, which is not reported either (see the table above). |

See [Diagnostics](diagnostics.md) for how findings are graded, suppressed, and used to fail a build.

## Configuration reference

Every key the `webhook` block of a `kind: webhookUnwrap` method takes, its default, and each rule the config is checked against. It is generated from the config schema, so it always matches what the generator accepts; the sections above explain what each key does in each target.

<!-- config-reference:start -->
<!-- Rendered from the config schema up to config-reference:end. Edit the schema descriptions, not this section: every regeneration rewrites it. -->

### webhook.eventTypes

**Type:** `Record<string, string>`

**Required**

Events this helper decodes, keyed by each event's name: the webhook operation's `operationId` when it has one, otherwise the webhook's key under `webhooks`. Only the keys select events; the value is descriptive. An empty map selects every top-level webhook. A key that names no event selects nothing and is reported with a `Config/WebhookUnknownEventType` warning.

### webhook.webhookKeyOpt

**Type:** `string | false`

Client option containing the webhook signing key, or false when verification is disabled.

### webhook.signatureAlgorithm

**Type:** `"hmac-sha1" | "hmac-sha256" | "hmac-sha512" | "ed25519" | "rsa-sha256"`

Signature verification algorithm for generated webhook helpers. Defaults to hmac-sha256 when verification is enabled.

**Default:** `"hmac-sha256"`

### webhook.signatureHeader

**Type:** `string`

Header carrying the webhook signature. Defaults to webhook-signature when verification is enabled.

**Default:** `"webhook-signature"`

### webhook.timestampHeader

**Type:** `string`

Header carrying the webhook timestamp, when replay protection uses one.

### webhook.toleranceSeconds

**Type:** `number`

Allowed timestamp skew in seconds for replay protection.

### webhook.discriminator

**Type:** `string`

Payload property used to discriminate webhook event variants.

### webhook.description

**Type:** `string`

Description surfaced on generated webhook helpers.

### webhook.summary

**Type:** `string`

Summary surfaced on generated webhook helpers.

### webhook.keyParam

**Type:** `string`

Experimental: may change in a later release. Name of the per-call argument that overrides the client's signing key, before target casing, e.g. `secret`. Defaults to `key`. TypeScript, Python and Ruby name that argument of the parse method and its verifying companions with it. The other targets keep their own spelling: Java, Kotlin, PHP, Swift and Dart already call it `secret`, and the rest take the key positionally. It must be a lowercase snake_case identifier, with no leading, trailing or doubled underscore (target casing drops those, so `payload_` would become `payload`), that is not `headers`, `body`, `payload`, a keyword of a generated language, or a name the generated helpers already bind (`wh`, `json`, `cast`, `get_required_header`, …).

**Constraints:** `pattern: ^(?!(?:headers|body|payload|options|opts|self|this|cls|class|def|end|and|or|not|in|is|if|else|elif|elsif|for|while|do|return|function|fun|var|val|let|const|new|delete|default|import|export|from|async|await|yield|lambda|none|true|false|null|nil|super|case|switch|try|catch|finally|throw|raise|with|as|pass|break|continue|global|nonlocal|typeof|instanceof|void|enum|interface|package|private|protected|public|static|module|begin|rescue|ensure|then|unless|until|when|redo|retry|undef|alias|defined|object|type|func|go|select|struct|chan|map|range|defer|fallthrough|goto|next|assert|del|except|extends|implements|debugger|arguments|eval|undefined|nan|infinity|wh|exc|json|cast|dict|isinstance|str|bytes|signed_headers|construct_type|get_required_header|verify_webhook_signature|refuse_unverifiable_algorithm|empty_key|b64decode|parsed)$)[a-z](?:_?[a-z0-9])*$`

### webhook.bytesKey

**Type:** `"raw" | "utf8"`

Experimental: may change in a later release. How the Python parse method reads a per-call key passed as `bytes`; its verifying companions always use `bytes` as the raw HMAC key. `raw` (the default) uses the bytes as the HMAC key itself, as the Standard Webhooks library does. `utf8` decodes them as UTF-8 and reads the text as a `str` key is read: an optional `whsec_` prefix stripped, the rest base64-decoded. Set `utf8` when callers pass the dashboard's secret as bytes (read from a file or `os.environb`). Only Python distinguishes a `bytes` key; the other targets take the key as a string and ignore this.

**Default:** `"raw"`

### webhook.typeName

**Type:** `string`

Experimental: may change in a later release. Name of the event union this helper returns, before target casing, e.g. `ParsedWebhookEvent`. Omit it to keep each target's own default, which for some targets follows the method name (`parse_pet` → `ParsePetWebhookEvent`) and for others is `ParsedWebhookEvent` on the top-level helper whatever the method is called. Set it when renaming the parse method must not rename the type callers already import. It applies to every target that honors it, so a target whose default differs (Rust's `WebhookEvent`) takes the configured name as well. It must end in `Event` (`ParsedWebhookEvent`, `webhook_event`), which keeps it clear of the runtime classes, params and response types, services and language built-ins each target declares on its own. A name a model, a webhook event, another webhook helper's union (its configured name or its default), or a websocket event type (`ReconnectingEvent`, `<Method>ClientEvent`, `<Method>ServerEvent`) already takes (compared ignoring case and separators) is ignored with a `Config/WebhookTypeNameConflict` warning, and a target may still keep its default where the name would clash with a type only it mints. Go always keeps its default envelope names, since every envelope-derived type shares one package with the models and their nested types.

**Constraints:** `pattern: [Ee]vent$`

### webhook.helpers

**Type:** `boolean | object`

Experimental: may change in a later release. Companion methods generated next to this parse method. `true` (the default) adds `verify_signature` (checks the signature only, and only when verification is enabled) and `parse_unsafe` (returns the typed event without verifying). `false` generates the parse method alone. An object turns each companion on or off, or renames it. A companion named like the parse method or another companion is left out, and so is a `parseUnsafe` named like a verifying companion (`verify_signature`, `unwrap`, or the names given to them), with a `Config/WebhookHelperNameUnsafe` warning. Where the name clashes with another member of the generated class — a method of the same resource, a second helper there — the target resolves it as its own naming rules do, leaving the companion out or qualifying its name (see the target's guide). C# generates no companions because it renders no parse method. Dart and C++ ignore this setting: Dart generates the parse method alone, and C++ always adds a decode-only `<method>_unverified` twin beside it and no other companion. Rust keeps each helper's `verify_signature` function even with `false`, since it is that helper's only verifier (the top-level helper's in `webhooks`, and, when helpers sign differently, each other helper's in its own module). Beside a top-level parse method named anything else, Go keeps a `Parsed` alias and Ruby a `parsed(payload, headers:, key:)` alias that forward to it, unless another member of the class (a companion, a second helper, a child resource) takes that name.

**Default:** `true`

#### verifySignature

**Type:** `boolean | string`

Method that verifies a delivery's signature, throwing when it does not verify. It returns nothing, except in Ruby, where it returns the verified payload parsed into a hash with symbol keys. `true` names it `verify_signature`, a string names it, `false` omits it (Rust keeps each helper's `verify_signature` function either way, as that helper's only verifier). Never generated beside a parse method that does not verify.

**Default:** `true`

#### parseUnsafe

**Type:** `boolean | string`

Method that decodes a delivery into the typed event without verifying its signature, for tests or a body verified elsewhere. `true` names it `parse_unsafe`, a string names it, `false` omits it.

**Default:** `true`

#### unwrap

**Type:** `boolean | string`

Method that verifies a delivery's signature and returns the decoded JSON untyped. Off by default; `true` names it `unwrap`, a string names it. Never generated beside a parse method that does not verify.

**Default:** `false`
<!-- config-reference:end -->

## Related

- [Configuration](configuration.md) — `resources`, methods, and the `clientSettings.opts` entry that holds the secret
- [OpenAPI Extensions](openapi-extensions.md) — the Fern extensions a webhook import reads
- [Diagnostics](diagnostics.md) — what a build reports about a webhook helper
