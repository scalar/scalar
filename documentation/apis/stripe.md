# Stripe API reference, SDKs and MCP server

*Last updated: September 2026 · Data from Stripe's public OpenAPI document, checked 2026-09-26*

Browse the Stripe API from Stripe's own OpenAPI document, see what it contains at a glance, and find the official SDKs and MCP server in one place.

<scalar-callout type="info">
This is an independent directory page. Scalar is not affiliated with Stripe. The reference below renders Stripe's public OpenAPI document, which Stripe publishes under the MIT licence in the [stripe/openapi](https://github.com/stripe/openapi) repository. For anything that affects money moving through your account, the [official Stripe API reference](https://docs.stripe.com/api) is the source of truth.
</scalar-callout>

## What the Stripe API covers

The Stripe API is a REST API for accepting payments and running the money side of an online business. The obvious parts are payments (PaymentIntents, Checkout Sessions, refunds, disputes) and billing (products, prices, subscriptions, invoices). Around those sit a lot of less obvious products: Connect for platforms that pay out to other businesses, Issuing for creating cards, Treasury, Terminal for in-person payments, Radar for fraud rules, Tax, and Financial Connections for linking bank accounts.

That breadth shows up in the document. Counting operations by their first path segment, the biggest areas are `customers` (47 operations), `test_helpers` (44), `treasury` (33), `issuing` (32), `accounts` (30) and `billing` (29). The `test_helpers` group is worth knowing about: those endpoints only work in test mode and let you simulate things that normally take days, such as advancing a test clock through a billing cycle.

Stripe now ships two API generations side by side. Almost everything lives under `/v1/`, where request bodies are form-encoded (`application/x-www-form-urlencoded`), which is why raw curl examples use `-d` flags instead of JSON. A newer `/v2/` namespace takes JSON bodies and currently holds 32 operations, mostly under `core` (accounts and event destinations) plus a few in `billing` and `commerce`. Stripe explains the split in its [API v2 overview](https://docs.stripe.com/api-v2-overview).

## Stripe OpenAPI document at a glance

We computed these numbers from `latest/openapi.spec3.json` in [stripe/openapi](https://github.com/stripe/openapi) (the file Stripe's README recommends for new projects) on 2026-09-26.

| | |
|---|---|
| OpenAPI version | 3.0.0 |
| API version in the document (`info.version`) | `2026-09-30.endive` |
| Server | `https://api.stripe.com/` |
| Path items | 454 |
| Operations (path + method) | 644 (612 under `/v1/`, 32 under `/v2/`) |
| Operations by method | 325 `POST`, 285 `GET`, 34 `DELETE` |
| Operations marked deprecated | 6 |
| List operations with cursor pagination (`starting_after`) | 126 |
| Search operations (`/search`) | 7 |
| Schemas in `components/schemas` | 1,701 |
| Security schemes | `basicAuth` (HTTP Basic), `bearerAuth` (HTTP Bearer) |
| Document licence | MIT |

Stripe also publishes a `preview/` folder with public preview endpoints and a legacy `openapi/` folder that is v1 only (431 path items, 612 operations). Note that the version string in the repository can run ahead of the docs: on the day we checked, Stripe's versioning page listed `2026-08-26.dahlia` as current, while the document on `master` already said `2026-09-30.endive`.

## Authentication

Every request needs an API key, and every request must go over HTTPS. Stripe's [authentication docs](https://docs.stripe.com/api/authentication) describe three kinds of server-side key:

- **Test mode secret keys** start with `sk_test_` and work against a sandbox.
- **Live mode secret keys** start with `sk_live_` and can reach every resource on the account.
- **Restricted keys** (`rk_live_` in live mode) carry only the permissions you give them. You can create as many as you need, in test and live mode. Stripe recommends these over the full secret key in live mode.

You send the key as the username in HTTP Basic auth with an empty password (`curl -u sk_test_...:`), or as `Authorization: Bearer ...`. That is exactly what the two security schemes in the OpenAPI document describe. Keep keys out of source code and client-side apps; read them from a secrets vault or an environment variable, as the examples below do.

## Versioning

Stripe versions its API by date plus a release name. Since `2024-09-30.acacia`, Stripe [releases a new version every month without breaking changes](https://docs.stripe.com/api/versioning), and twice a year it starts a new major release that can contain breaking changes.

Which version a request uses depends on how you call the API. Raw HTTP requests use your account's default version (set in Workbench) unless you send a `Stripe-Version` header. Recent official SDKs pin the API version that was current when that SDK version was released, so upgrading the SDK is how you move to a newer API version. Webhook endpoints have their own version, set when you create the endpoint. If you use a pinned SDK, create your webhook endpoints with the same version or the payload shapes will not match your types.

## Official Stripe SDKs

These examples use Stripe's **own official server-side SDKs**, not SDKs generated by Scalar. Stripe maintains libraries for [Node.js, Python, Go, Ruby, PHP, Java and .NET](https://docs.stripe.com/sdks/server-side); the three shown here are MIT licensed. Each example creates a customer.

<scalar-tabs>
<scalar-tab title="Node.js">

```bash
npm install stripe
```

```js
// Official Stripe library: https://github.com/stripe/stripe-node
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const customer = await stripe.customers.create({
  email: 'jenny.rosen@example.com',
})

console.log(customer.id)
```

</scalar-tab>
<scalar-tab title="Python">

```bash
pip install stripe
```

```python
# Official Stripe library: https://github.com/stripe/stripe-python
import os

from stripe import StripeClient

client = StripeClient(os.environ["STRIPE_SECRET_KEY"])

customer = client.v1.customers.create(
    params={"email": "jenny.rosen@example.com"},
)

print(customer.id)
```

</scalar-tab>
<scalar-tab title="Go">

```bash
go get -u github.com/stripe/stripe-go/v86
```

```go
// Official Stripe library: https://github.com/stripe/stripe-go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/stripe/stripe-go/v86"
)

func main() {
	sc := stripe.NewClient(os.Getenv("STRIPE_SECRET_KEY"))

	customer, err := sc.V1Customers.Create(context.TODO(), &stripe.CustomerCreateParams{
		Email: stripe.String("jenny.rosen@example.com"),
	})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(customer.ID)
}
```

</scalar-tab>
</scalar-tabs>

Latest releases on 2026-09-26: stripe-node v22.6.2, stripe-python v15.6.1, stripe-go v86.4.2. Use a `sk_test_` key while you try these out.

## Stripe MCP server

Stripe runs its own official MCP server at `https://mcp.stripe.com`. Use that one if you want an AI agent to work with your Stripe account. According to [Stripe's MCP docs](https://docs.stripe.com/mcp), it authenticates with OAuth or with an agent API key, and from October 31, 2026 it stops accepting full-access secret keys and restricted keys that do not carry the Agent tag. For example, in Claude Code:

```bash
claude mcp add --transport http stripe https://mcp.stripe.com/
```

Scalar does not host an MCP server for Stripe's API, and you do not need one.

## Host an MCP server for your own API with Scalar

If you are building an API of your own (perhaps one that sits in front of Stripe), you can give it the same kind of agent access without writing server code. Scalar generates an MCP server from your OpenAPI document and [hosts it for you](/products/agent/mcp) at `mcp.scalar.com`, so there is nothing to deploy or patch when your API changes.

<scalar-steps>
<scalar-step title="Upload your OpenAPI document">

Add your API to the [Scalar Dashboard](https://dashboard.scalar.com), or push it to the [Scalar Registry](/products/registry) from CI.

</scalar-step>
<scalar-step title="Choose the tools">

Under **MCP**, create a server and pick which operations an agent may only search and which it may execute.

</scalar-step>
<scalar-step title="Connect a client">

Create an installation, store the credential Scalar should use to call your API, and add the installation URL to your MCP client. People outside your team can sign in with OAuth.

</scalar-step>
</scalar-steps>

```bash
claude mcp add \
  YOUR_MCP_SERVER_NAME \
  https://mcp.scalar.com/mcp/YOUR_MCP_SERVER_ID \
  --header "Authorization: YOUR_PERSONAL_ACCESS_TOKEN" \
  --transport http
```

The same OpenAPI document can also produce your [API reference](/products/api-references) and [SDKs](/products/sdk-generator) (TypeScript, Python, Go, Java, Kotlin and CLI are generally available).

## Official Stripe documentation

- [Stripe API reference](https://docs.stripe.com/api)
- [Stripe OpenAPI repository](https://github.com/stripe/openapi) and its [changelog](https://github.com/stripe/openapi/releases/)
- [API changelog](https://docs.stripe.com/changelog) and [upgrade guide](https://docs.stripe.com/upgrades)
- [Server-side SDKs](https://docs.stripe.com/sdks/server-side)
- [Stripe MCP server](https://docs.stripe.com/mcp)

## Frequently asked questions

<scalar-detail title="Does Stripe have an OpenAPI document?">

Yes. Stripe publishes OpenAPI 3.0 documents in the [stripe/openapi](https://github.com/stripe/openapi) repository on GitHub, in JSON and YAML, under the MIT licence. The `latest/` folder covers v1 and v2 endpoints and is the one Stripe recommends for new projects. The repository is updated with every Stripe API release.

</scalar-detail>

<scalar-detail title="How many endpoints does the Stripe API have?">

The `latest/openapi.spec3.json` document we checked on 2026-09-26 has 454 paths and 644 operations: 612 under `/v1/` and 32 under `/v2/`. The count moves with every release, so treat it as a snapshot.

</scalar-detail>

<scalar-detail title="What is the difference between spec3.json and spec3.sdk.json?">

Stripe's README calls the plain `spec3` files the public documents for most purposes. The `sdk` variants add annotations, deprecated endpoints and pre-release features that Stripe uses to generate its own libraries. If you want to browse or test the API, use the plain file.

</scalar-detail>

<scalar-detail title="Is there an official Stripe MCP server?">

Yes. Stripe hosts one at `https://mcp.stripe.com`, with OAuth and agent API keys for authentication. It exposes tools that search and call the Stripe API and search Stripe's documentation. See [Stripe's MCP docs](https://docs.stripe.com/mcp) for setup in Claude, Cursor, VS Code, Codex and other clients.

</scalar-detail>

<scalar-detail title="Can I generate my own Stripe SDK from the OpenAPI document?">

You can, but for Stripe itself you usually should not. Stripe's official SDKs pin API versions, ship types that match them, and are updated with each release. Generating an SDK makes sense for your own API, which is what the [Scalar SDK generator](/products/sdk-generator) is for.

</scalar-detail>

<scalar-detail title="Which Stripe API version should I use?">

For a new integration, the version your SDK pins is the simplest choice, because the SDK's types match it. For raw HTTP calls, send an explicit `Stripe-Version` header rather than relying on the account default, so an upgrade in the Dashboard cannot change your responses unexpectedly.

</scalar-detail>

## Related

- **Learn:** [What is MCP?](/learn/mcp/what-is-mcp) · [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi)
- **Docs:** [MCP servers guide](/products/agent/mcp)
- **Product:** [Scalar Agent](/products/agent/mcp) — a hosted MCP server from your own OpenAPI document, with OAuth and nothing to deploy

---

*Stripe is a trademark of Stripe, Inc. This page is not affiliated with or endorsed by Stripe. Statistics were computed by Scalar from Stripe's public OpenAPI document on 2026-09-26, and facts about authentication, versioning, SDKs and the MCP server come from Stripe's documentation as linked above, checked the same day. If something is wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues).*
