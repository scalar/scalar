# Scalar auth.md

This file is for agents helping a user access Scalar services. Scalar currently supports user-managed signup and personal API keys. Automated Auth.md account registration, ID-JAG identity assertions, anonymous provisioning, and claim ceremonies are not currently advertised for Scalar accounts.

## 1. Register or sign in

Ask the user to [create a Scalar account](https://dashboard.scalar.com/register), or [sign in](https://dashboard.scalar.com/login) if they already have one. Signup and sign-in take place in the dashboard and require user interaction.

The dashboard registration URL is a browser page, not an agent registration API. There is no documented Auth.md registration request body or automated credential issuance flow for Scalar accounts.

## 2. Obtain a credential

The user can create a personal API key in the [Scalar Dashboard](https://dashboard.scalar.com/user/api-keys), under Account > API Keys. Use a credential the user has explicitly provided through your runtime's secret configuration.

Keep API keys out of URLs, committed files, logs, and chat messages. Use the key only for the Scalar services the user has authorized you to access.

## 3. Use the credential

For the Scalar CLI, supply the key through the CLI's token option:

```sh
scalar auth login --token "$SCALAR_API_KEY"
scalar auth whoami
```

For the Scalar Agent SDK, pass the personal token to the `token` option of `agentScalar`, then select the user's MCP installation. See the [Agent SDK guide](https://scalar.com/products/agent/integration/sdk) for supported integrations and request examples.

For direct connections to a hosted MCP installation, follow the [MCP guide](https://scalar.com/products/agent/mcp). Team members use a personal access token; external users follow the installation's configured OAuth flow. Authentication and access depend on the installation, so use its discovery metadata and documented credential format.

## 4. Handle authentication failures and revoke access

If authentication fails, stop and ask the user to check the credential and their access to the selected resource. Do not repeat signup or create another account to work around an access failure.

The user manages personal API keys in [Account > API Keys](https://dashboard.scalar.com/user/api-keys). To end the CLI session, run `scalar auth logout`. Logging out of the CLI does not revoke the API key.

## OAuth discovery

OAuth metadata served by a hosted documentation site or MCP installation describes access to that resource. OAuth client registration is distinct from creating a Scalar dashboard account. Do not interpret an OAuth `registration_endpoint` as support for Auth.md account provisioning.

Only use an Auth.md registration flow when the relevant authorization server advertises `agent_auth` and documents a supported method. This file does not advertise an agent registration, claim, token exchange, or revocation API for personal API keys.
