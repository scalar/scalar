import { isObject } from '@scalar/helpers/object/is-object'
import { validate as validateDocument } from '@scalar/openapi-validator'

import type { OpenApiVersion } from '@/configuration'
import type {
  ErrorObject,
  Filesystem,
  StrictOpenApiDocument,
  ThrowOnErrorOption,
  UnknownObject,
  ValidateResult,
} from '@/types/index'

import { getEntrypoint } from './get-entrypoint'
import { makeFilesystem } from './make-filesystem'
import { resolveReferences } from './resolve-references'

export type ValidateOptions = ThrowOnErrorOption

const withStrictSpecification = (
  specification: UnknownObject,
  version: OpenApiVersion,
): StrictOpenApiDocument | undefined => {
  if (!specification || typeof specification !== 'object') {
    return undefined
  }

  if (version === '2.0' && specification.swagger === '2.0') {
    return specification as StrictOpenApiDocument
  }

  if ((version === '3.0' || version === '3.1' || version === '3.2') && typeof specification.openapi === 'string') {
    return specification as StrictOpenApiDocument
  }

  return undefined
}

/**
 * Validates an OpenAPI document.
 *
 * Schema and semantic validation are delegated to `@scalar/openapi-validator`.
 * Reference resolution stays in the parser: references are resolved here and any
 * resolution errors are merged into the result, so the behaviour matches the
 * previous, self-contained validator.
 */
export function validate(
  value: string | UnknownObject | Filesystem,
  options?: ValidateOptions,
): Promise<ValidateResult> {
  try {
    const filesystem = makeFilesystem(value)
    const entrypoint = getEntrypoint(filesystem)

    const specification = entrypoint.specification as UnknownObject

    // Be lenient about a missing `info.version`: default it before validation so
    // documents that omit this required field still validate. The standalone
    // `@scalar/openapi-validator` is strict and would otherwise reject them.
    if (isObject(specification) && isObject(specification.info) && typeof specification.info.version !== 'string') {
      specification.info.version = '0.1.0'
    }

    // Schema, version and path-parameter validation (no reference resolution).
    // Runs first so empty/invalid input reports the same error, in the same
    // order, including when `throwOnError` is set.
    const outcome = validateDocument(specification, options)

    // Resolve references whenever the document passed schema validation, even
    // when path-parameter semantics failed, so reference-resolution errors are
    // reported alongside those semantic errors. This matches the previous
    // validator, which merged both error sets. `outcome.schema` is only set once
    // schema and version validation succeeded.
    const passedSchemaValidation = outcome.schema !== undefined
    const resolved = passedSchemaValidation ? resolveReferences(filesystem, options) : undefined
    const referenceErrors: ErrorObject[] = resolved?.errors ?? []
    const schema = (resolved?.schema ?? outcome.schema) as StrictOpenApiDocument | undefined

    const errors = [...(outcome.errors ?? []), ...referenceErrors]
    const valid = outcome.valid && referenceErrors.length === 0

    if (!valid) {
      return Promise.resolve({
        valid: false,
        errors,
        schema,
        specification,
        version: outcome.version,
      })
    }

    const strictSpecification = withStrictSpecification(specification, outcome.version)

    if (!strictSpecification) {
      return Promise.resolve({
        valid: false,
        errors: [
          {
            message: `Validated OpenAPI ${outcome.version} document is missing required top-level version field.`,
          },
        ],
        schema,
        specification,
        version: outcome.version,
      })
    }

    return Promise.resolve({
      valid: true,
      errors,
      schema: schema as StrictOpenApiDocument,
      specification: strictSpecification,
      version: outcome.version,
    })
  } catch (err) {
    return Promise.reject(err)
  }
}
