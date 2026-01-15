# Rules
This guide will help you start using our Rules feature to lint and verify your OpenAPI documents with Spectral-compatible rulesets. Scalar rules can be used across hosted APIs and schemas, and can be managed alongside our [CLI](../cli/getting-started.md).

Make sure you have created a Scalar Account & are logged in ([see create account guide](getting-started.md#create-your-scalar-account))

## Create your first rule
Now let's create our first rule!

From the [dashboard](https://dashboard.scalar.com) left-most sidebar under Rules, then click "+ New".

![Scalar Rules Page](../../assets/scalar-rules.png "Scalar Rules Page")

![Scalar Create Rule](../../assets/scalar-rules-1.png "Scalar Create Rule")

Rules allow you to lint and verify your API documents with Spectral-compatible rulesets. Your rules are stored in the Scalar Registry and can be shared across your team or made public.

### Configure your rule
When you create a new rule, it will extend the default Spectral OSS ruleset (`spectral:oas`). This provides a solid foundation of OpenAPI linting rules from the [Spectral project](https://stoplight.io/open-source/spectral).

![Scalar Rule Editor](../../assets/scalar-rules-edit.png "Scalar Rule Editor")

The default rule configuration looks like this:

```yaml
extends: spectral:oas
rules: {}
```

You can customize your rule by:
- **Extending other rulesets**: Reference other Spectral rulesets or your own custom rules
- **Adding custom rules**: Define your own linting rules specific to your API standards
- **Overriding existing rules**: Modify the severity or behavior of inherited rules

For more information about Spectral rules and how to write custom rules, see the [Spectral documentation](https://meta.stoplight.io/docs/spectral/docs/getting-started/rulesets.md).

## Use the rule with CLI
Now let's use your rule to lint an OpenAPI document using the Scalar CLI.

You can lint your OpenAPI files using the `scalar document lint` command:

```bash
scalar document lint ./openapi.yaml
```

To use a specific rule from the Scalar Registry, use the `--rule` option:

```bash
scalar document lint ./openapi.yaml --rule registry.scalar.com/@your-namespace/rules/your-rule-slug
```

You can also use a local rule file:

```bash
scalar document lint ./openapi.yaml --rule ./my-custom-ruleset.yaml
```

The lint command will analyze your OpenAPI document and report any violations based on the rules you've configured. This helps ensure your API documentation follows best practices and maintains consistency across your organization.

## Rule access and sharing
Just like other resources in the Scalar Registry, you can control who has access to your rules.

### Public rules
Public rules can be shared with anyone and are accessible via their registry path. This is useful for open-source projects or when you want to share your linting standards with the community.

### Private rules
Private rules are restricted to your organization and can be shared with specific access groups. This is ideal for internal API standards and company-specific linting requirements.

You can manage rule access from the rule's Overview page in the dashboard, similar to how you manage access for other registry resources.

## Integration with CI/CD
You can integrate rule-based linting into your CI/CD pipelines to automatically validate OpenAPI documents before they're merged or deployed.

Example GitHub Actions workflow:

```yaml
name: Lint OpenAPI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @scalar/cli
      - run: scalar document lint ./openapi.yaml --rule registry.scalar.com/@your-namespace/rules/your-rule-slug
```

This ensures that all OpenAPI documents meet your organization's standards before they're published or used to generate documentation.

## Next steps
- Learn more about the [Scalar Registry CLI](cli.md) for managing rules programmatically
- Explore [Spectral rules documentation](https://meta.stoplight.io/docs/spectral/docs/getting-started/rulesets.md) to create custom rules
- Check out our [Registry getting started guide](getting-started.md) for more information about managing resources in the Scalar Registry
