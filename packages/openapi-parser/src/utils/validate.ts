import { isObject } from '@scalar/helpers/object/is-object'
import { validate as validateDocument, validatePathParameters } from '@scalar/openapi-validator'

import { ERRORS, type OpenApiVersion } from '@/configuration'
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

    // A filesystem without an entrypoint (for example a top-level array) has no
    // document to validate.
    if (!entrypoint || entrypoint.specification === undefined || entrypoint.specification === null) {
      if (options?.throwOnError) {
        throw new Error(ERRORS.EMPTY_OR_INVALID)
      }

      return Promise.resolve({ valid: false, errors: [{ message: ERRORS.EMPTY_OR_INVALID }] })
    }

    const specification = entrypoint.specification as UnknownObject

    // Be lenient about a missing `info.version`: default it before validation so
    // documents that omit this required field still validate. The standalone
    // `@scalar/openapi-validator` is strict and would otherwise reject them.
    if (isObject(specification) && isObject(specification.info) && typeof specification.info.version !== 'string') {
      specification.info.version = '0.1.0'
    }

    // Schema and version validation only (no reference resolution). Runs first so
    // empty/invalid input reports the same error, in the same order, including
    // when `throwOnError` is set. Path-parameter semantics are skipped here and
    // run below on the resolved document, so parameters declared via `$ref` are
    // seen (validating the unresolved document would report them as missing).
    const outcome = validateDocument(specification, { ...options, skipPathParameterValidation: true })

    // Resolve references whenever the document passed schema validation.
    // `outcome.schema` is only set once schema and version validation succeeded.
    const passedSchemaValidation = outcome.schema !== undefined
    const resolved = passedSchemaValidation ? resolveReferences(filesystem, options) : undefined
    const referenceErrors: ErrorObject[] = resolved?.errors ?? []
    const schema = (resolved?.schema ?? outcome.schema) as StrictOpenApiDocument | undefined

    // Path-template semantics run on the resolved document (schema validation
    // stays on the unresolved one to avoid following circular references). This
    // matches the previous validator, which merged reference and semantic errors.
    const semanticErrors = passedSchemaValidation
      ? validatePathParameters((schema ?? specification) as UnknownObject)
      : []

    const errors = [...(outcome.errors ?? []), ...referenceErrors, ...semanticErrors]
    const valid = outcome.valid && referenceErrors.length === 0 && semanticErrors.length === 0

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
