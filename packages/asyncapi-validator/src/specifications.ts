import asyncapiSpecs from '@asyncapi/specs'

/**
 * The AsyncAPI versions supported by the validator.
 *
 * When `@asyncapi/specs` adds a new version, add it here and bump the dependency.
 */
export type AsyncApiVersion = '2.0.0' | '2.1.0' | '2.2.0' | '2.3.0' | '2.4.0' | '2.5.0' | '2.6.0' | '3.0.0' | '3.1.0'

/**
 * The AsyncAPI JSON Schemas keyed by version, sourced from `@asyncapi/specs`.
 *
 * These are bundled and self-contained, so Ajv can compile each one without
 * resolving external files.
 *
 * We use the "without $id" variant on purpose: the standard bundle embeds the
 * draft-07 meta-schema with its own `$id`, which collides with Ajv's built-in
 * draft-07 ("reference resolves to more than one schema"). The `$id`-free
 * variant compiles cleanly while still resolving every internal reference.
 *
 * The cast keeps the emitted declarations from depending on `@asyncapi/specs`'
 * transitive `@types/json-schema`.
 */
export const AsyncApiSpecifications = asyncapiSpecs.schemasWithoutId as unknown as Record<
  AsyncApiVersion,
  Record<string, unknown>
>

export const AsyncApiVersions = Object.keys(AsyncApiSpecifications) as AsyncApiVersion[]
