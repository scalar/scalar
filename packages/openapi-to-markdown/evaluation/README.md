# Markdown evaluation

Run from the repository root after installing dependencies and building packages:

```sh
pnpm --filter @scalar/openapi-to-markdown evaluate
```

The harness converts seven fixed OpenAPI documents through the public Markdown renderer. It checks feature details, Markdown formatting, reference overrides, clean output, and repeatability. Each check has equal weight. The initial renderer passes 27 of 37 checks.

Baseline checks fail the test if existing behavior is lost. Missing features remain visible in the report without failing the baseline. To require every check to pass:

```sh
MARKDOWN_EVALUATION_STRICT=1 pnpm --filter @scalar/openapi-to-markdown evaluate
```

Save a JSON report and each rendered Markdown document for inspection:

```sh
MARKDOWN_EVALUATION_OUTPUT=/tmp/markdown-baseline pnpm --filter @scalar/openapi-to-markdown evaluate
```

Compare `passed`, `total`, and individual check results between runs. Keep the corpus fixed during an improvement series. Inspect the Markdown files too: a matching phrase does not prove the whole document is correct. Tests also run as part of the package test suite. The package Vitest configuration loads Vue so tests exercise the source renderer.

This is a small deterministic regression corpus, not a measure of all OpenAPI support or an LLM quality judgment. It does not yet cover authentication, callbacks, external references, XML, every JSON Schema keyword, or all OpenAPI versions. Add fixtures for those separately and record a new baseline before comparing scores.
