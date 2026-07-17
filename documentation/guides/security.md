# Security

Scalar helps teams create API interfaces built for developers and agents, including API references, SDKs, API clients, and MCPs from a shared OpenAPI source. Scalar has received a SOC 2&reg; Type 1 report on controls relevant to security and maintains GDPR-compliant privacy practices.

<div class="flex gap-2">
  <a class="t-editor__button button__primary" href="https://trust.scalar.com" target="_blank">View Trust Center</a>
  <a class="t-editor__button button__secondary" href="mailto:support@scalar.com?subject=Security%20question">Contact security</a>
</div>

## Trust and compliance

- **SOC 2 report:** Scalar has received a SOC 2 Type 1 report for controls relevant to security.
- **GDPR privacy:** Scalar publishes European privacy rights and data processing details in our [Privacy Policy](/legal/privacy-policy).
- **Trust Center:** Security documentation and compliance materials are available at [trust.scalar.com](https://trust.scalar.com).

## Access controls

Use Scalar as a controlled surface for API descriptions, SDK generation, MCP installations, registry workflows, and developer tooling.

- **Single sign-on:** SAML-based SSO keeps authentication tied to your organization's identity provider. Read the [SSO guide](/resources/sso/getting-started).
- **Role-based access:** Manage access boundaries across workspaces, teams, and API projects as your organization grows.
- **Private API interfaces:** Publish internal references, portals, and API workflows behind access controls while keeping public interfaces simple to share.
- **Git-native review:** Keep API description changes visible in the same review flow your engineers already use.

## Privacy

Scalar's hosted API interfaces are privacy-friendly by default, with only technically required cookies used for authentication and routing.

- **Technically required cookies only:** Scalar uses required cookies for authentication and subpath routing, not visitor profiling.
- **No fingerprinting:** Custom-domain projects do not use fingerprinting technologies to identify visitors.
- **No request IP logging:** Request traffic is not logged; internal proxy error logs do not include IP addresses.
- **GDPR privacy rights:** European users can request access, correction, deletion, transfer, or withdraw consent through Scalar's privacy contact.

Read more in the [privacy notes](/products/docs/privacy).

## API lifecycle security

Scalar treats OpenAPI as a source of truth for developer docs, API clients, generated SDKs, MCP servers, and review workflows.

- **Auth-aware API descriptions:** Model API keys, bearer tokens, OAuth flows, and other security schemes directly in your OpenAPI document.
- **Rules and validation:** Add review gates and linting so API changes are caught before they reach consumers.
- **SDK generation:** Generate production-ready SDKs and CLIs from reviewed API descriptions. See the [SDK Generator](/products/sdk-generator/getting-started).
- **MCP guardrails:** Choose which endpoints become tools, decide search versus execute modes, and apply API auth per installation. See [MCP & Agent](/products/agent/getting-started).
- **Self-hostable foundation:** Run Scalar's open-source tooling in your own environment when your architecture requires it.

## Responsible disclosure

If you find a vulnerability, email [support@scalar.com](mailto:support@scalar.com?subject=Security%20vulnerability%20report). We will acknowledge your report, triage the issue, and keep you updated as we work through a fix.
