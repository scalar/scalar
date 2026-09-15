import { isObject } from '@scalar/helpers/object/is-object'
import type { AnyObject } from '@scalar/types/utils'
import { parse as parseYaml } from 'yaml'

import type { ErrorObject, ValidationOutcome } from '@/types'
import { createValidator } from '@/validate'

type SchemaObject = Record<string, unknown>

/** Options every specification validator accepts. */
export type SpecificationValidatorOptions = {
  /**
   * If `true`, throw on the first error instead of returning it.
   *
   * @default false
   */
  throwOnError?: boolean
}

/**
 * Everything a single specification (OpenAPI, AsyncAPI, …) contributes on top of
 * the shared JSON Schema engine.
 */
export type SpecificationValidatorConfig<TVersion extends string, TOptions extends SpecificationValidatorOptions> = {
  /** The JSON Schema for each supported version. */
  schemas: Record<TVersion, SchemaObject>
  /** Detects the specification version from a parsed document. */
  detectVersion: (document: AnyObject) => TVersion | undefined
  /** Extra Ajv formats to register for a version, compiled into its validator. */
  formats?: (version: TVersion) => Record<string, unknown> | undefined
  /** Messages for the two failures that happen before schema validation. */
  errors: {
    /** The input is missing or is not a document. */
    emptyOrInvalid: string
    /** The document's version is not supported. */
    versionNotSupported: string
  }
  /**
   * Adjusts the document before schema validation without touching the caller's
   * copy (AsyncAPI, for example, pins `asyncapi` to an exact version). The
   * original document is still what is returned as `schema` and handed to
   * `postValidate`. Defaults to validating the document as-is.
   */
  prepareDocument?: (specification: AnyObject, version: TVersion) => AnyObject
  /**
   * Extra semantic checks run after a successful schema validation (for example
   * OpenAPI path-template rules the JSON Schema cannot express). Any returned
   * errors mark the document invalid.
   */
  postValidate?: (specification: AnyObject, version: TVersion, options: TOptions | undefined) => ErrorObject[]
}

/**
 * Builds a `validate` function for a single specification on top of the shared
 * JSON Schema engine.
 *
 * The returned function parses string input, rejects non-documents, detects the
 * version, validates against the matching schema (compiled once per version and
 * reused), and runs any specification-specific `postValidate` checks.
 */
export function createSpecificationValidator<
  TVersion extends string,
  TOptions extends SpecificationValidatorOptions = SpecificationValidatorOptions,
>(config: SpecificationValidatorConfig<TVersion, TOptions>) {
  // Core validators, compiled once per version and reused across calls.
  const validatorsByVersion = new Map<TVersion, ReturnType<typeof createValidator>>()

  const getValidator = (version: TVersion) => {
    let validator = validatorsByVersion.get(version)

    if (!validator) {
      validator = createValidator(config.schemas[version], { formats: config.formats?.(version) })
      validatorsByVersion.set(version, validator)
    }

    return validator
  }

  return (document: string | AnyObject, options?: TOptions): ValidationOutcome<TVersion> => {
    let specification: AnyObject

    if (typeof document === 'string') {
      // A malformed JSON/YAML string is a validation failure like any other, so
      // it respects `throwOnError` rather than escaping as a parser exception.
      try {
        specification = parseYaml(document)
      } catch (error) {
        if (options?.throwOnError) {
          throw error
        }

        return { valid: false, errors: [{ message: error instanceof Error ? error.message : String(error) }] }
      }
    } else {
      specification = document
    }

    try {
      // The document is empty or invalid. A YAML/JSON string can parse to a
      // primitive or an array, neither of which is a document, so guard against
      // anything that is not a plain object rather than only null/undefined.
      if (!isObject(specification)) {
        if (options?.throwOnError) {
          throw new Error(config.errors.emptyOrInvalid)
        }

        return { valid: false, errors: [{ message: config.errors.emptyOrInvalid }] }
      }

      const version = config.detectVersion(specification)

      if (!version) {
        if (options?.throwOnError) {
          throw new Error(config.errors.versionNotSupported)
        }

        return { valid: false, errors: [{ message: config.errors.versionNotSupported }] }
      }

      const documentToValidate = config.prepareDocument?.(specification, version) ?? specification
      const result = getValidator(version)(documentToValidate, options)

      if (!result.valid) {
        return { valid: false, version, errors: result.errors }
      }

      const semanticErrors = config.postValidate?.(specification, version, options) ?? []

      if (semanticErrors.length > 0) {
        if (options?.throwOnError) {
          throw new Error(semanticErrors[0]?.message ?? 'Validation failed')
        }

        return { valid: false, version, errors: semanticErrors, schema: specification }
      }

      return { valid: true, version, errors: [], schema: specification }
    } catch (error) {
      if (options?.throwOnError) {
        throw error
      }

      return { valid: false, errors: [{ message: error instanceof Error ? error.message : String(error) }] }
    }
  }
}
