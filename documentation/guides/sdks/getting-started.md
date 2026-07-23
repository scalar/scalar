# Getting Started

Generate your first type-safe SDK or CLI from an OpenAPI document in minutes, straight from the Scalar dashboard.

> [!NOTE]
> SDK generation is part of our paid plans and costs $100 per month per target. Keep this in mind when selecting what you want to generate.

Make sure you have created a Scalar account and are logged in. If you are new to Scalar, start with the [create account guide](../registry/getting-started.md#create-your-scalar-account).

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

- [Build, version, and download](managing.md) your targets
- [Configure](configuration.md) each SDK or CLI
- [Publish to a package registry](publishing/overview.md)
- [Add custom code](custom-code.md) that survives regeneration
