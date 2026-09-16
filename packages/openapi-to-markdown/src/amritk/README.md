# Experimental @amritk store pipeline

Adapted from [amritk/api-reference/src/store](https://github.com/amritk/api-reference/tree/c18e38e395d84ea0d109967da96399ec526836f8/src/store), commit `c18e38e395d84ea0d109967da96399ec526836f8` (package license: MIT).

- Parse JSON first, falling back to `@amritk/yaml` 0.1.1.
- Bundle external references with the store's `bundleExternalRefs` adapter and `@amritk/resolve-refs` 0.2.0. Self-contained documents skip bundling.
- Coerce using the repository's committed generated OpenAPI 3.1 parser. Its schema-object parser preserves JSON Schema content without recursive schema coercion.
- Attach the repository's non-enumerable `$ref-value` compatibility pointers. Targets share identity; there are no magic proxies or document-wide dereferenced copies.

The upstream store now also offers ambient, on-demand resolution. This experiment uses its `attachRefValues` compatibility helper instead because Scalar's example and path helpers expect `$ref-value`, and concurrent server renders must not share an ambient active document.

The generated files are copied unchanged from `src/store/generated` at that commit. To regenerate them, use the upstream repository's `schemas/openapi-3.1.json` and `scripts/generate-openapi-parser.ts` (`@amritk/generate-parsers` 0.7.2, embedded helpers). No code generation or runtime-validator compilation occurs during conversion.

Local file loading and the existing Scalar upgrade step are retained for backwards compatibility. This is an experimental alternative loader, not a wholesale replacement of `workspace-store`: rendering and example generation still use its schema and reference helpers.
