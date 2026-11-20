# Getting Started

Generate your first type-safe SDK or CLI from an OpenAPI document in minutes, straight from the Scalar dashboard.

Make sure you have created a Scalar account and are logged in. If you are new to Scalar, start with the [create account guide](../registry/getting-started.md#create-your-scalar-account).

## Set up with a coding agent

Copy this prompt into your coding agent to get your first SDKs working. It helps you choose your targets and package names, then guides you through a first build. GitHub and package publishing are optional next steps.

<scalar-prompt title="Set up your first SDKs">

```text
Help me get my first SDKs working with Scalar.

Look through this repository first, then ask me a few questions.
Skip anything you already know and suggest defaults where helpful:

1. Which API should we use: an OpenAPI file, a URL, or an API
   already in Scalar?
2. Which SDK languages do I need? Would a CLI for my API be useful?
3. What should the packages be called, and which Scalar team
   should they belong to?

Use Scalar's MCP at https://mcp.scalar.com/ to set things up
in the dashboard. Help me connect and sign in if needed.
For documentation, use its search tools if available, or
the docs MCP at https://scalar.com/mcp.

Use the Scalar CLI where helpful. Run
`npx -y @scalar/cli@latest context --no-input` to discover its commands first.

Once we have made those choices:
- Validate the OpenAPI document and reuse any existing setup.
- Configure and build the SDKs, asking about anything important
  you cannot determine, such as authentication or base URLs.
- Check the build results and help me install and try each SDK
  with a small example.

Do everything your tools support, and walk me through any
remaining dashboard steps. Keep credentials out of source files.

Aim for a working first build. At the end, show me what was
created, how to use it, and how to rebuild after API changes.
Then ask whether I want to set up GitHub or package publishing.
```

</scalar-prompt>

## Generate your first target

<scalar-steps>
  <scalar-step id="step-1" title="Upload OpenAPI Document">

From the [dashboard](https://dashboard.scalar.com), click "Create new SDK".

If you do not already have an OpenAPI document in the registry, import it directly from the modal.

  </scalar-step>

  <scalar-step id="step-2" title="Select Desired Targets">

Select as many SDKs or CLIs as you need, or choose one target to start. Once you click "Continue", Scalar begins generating your targets.

  </scalar-step>

  <scalar-step id="step-3" title="Manage your new SDKs">

Once created, you will be redirected to the SDK overview page. From there you can:

- [Build, version, and download](managing.md) your SDK
- [Configure](configuration.md) each target
- [Link a GitHub repository](publishing/github.md) and [publish to a registry](publishing/overview.md)
- [Customize the generated code](custom-code.md) without losing future updates

  </scalar-step>
</scalar-steps>

<scalar-image
  src="/sdk-dashboard-static.svg"
  src-dark="/sdk-dashboard-static-dark.svg"
  alt="Scalar SDK dashboard"
  size="full">
</scalar-image>

## Next steps

- [Try the interactive demo](index.md) at the top of the SDK Generator overview to walk the flow again without the dashboard
- [Build, version, and download](managing.md) your targets
- [Configure](configuration.md) each SDK or CLI
- [Add pagination helpers](pagination.md) to your list endpoints
- [Add webhook helpers](webhooks.md) that verify and decode the events your API sends
- [Publish to a package registry](publishing/overview.md)
- [Add custom code](custom-code.md) that survives regeneration
- [Read the diagnostics](diagnostics.md) each build reports about your API description
