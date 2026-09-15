import type { AnyObject } from '@scalar/types/utils'
import Ajv, { type ValidateFunction } from 'ajv'
import Ajv2020 from 'ajv/dist/2020.js'
import Ajv04 from 'ajv-draft-04'
import addFormats from 'ajv-formats'
import { parse as parseYaml } from 'yaml'

import type { AjvError } from '@/prettify-ajv-errors'
import { transformErrors } from '@/transform-errors'
import type { CreateValidatorOptions, ValidateOptions, ValidationResult } from '@/types'

type SchemaObject = Record<string, any>

/**
 * Ajv classes keyed by the JSON Schema dialect a schema declares in `$schema`.
 *
 * The keys omit the trailing `#`, which schemas include inconsistently (OpenAPI
 * draft-04 has it, the AsyncAPI draft-07 schemas do not). Lookups normalize the
 * `$schema` value the same way so both variants resolve.
 */
const ajvClassesByDialect = {
  'http://json-schema.org/draft-04/schema': Ajv04,
  'http://json-schema.org/draft-07/schema': Ajv,
  'https://json-schema.org/draft/2020-12/schema': Ajv2020,
}

const compile = (schema: SchemaObject, formats?: Record<string, unknown>): ValidateFunction => {
  const dialect = typeof schema.$schema === 'string' ? schema.$schema.replace(/#$/, '') : ''
  const AjvClass = ajvClassesByDialect[dialect as keyof typeof ajvClassesByDialect] ?? Ajv

  const ajv = new AjvClass({
    // Ajv is a bit too strict in its strict validation of these schemas.
    strict: false,
    // Enable discriminator support for better oneOf error messages
    discriminator: true,
    // Show all errors, not just the first one
    allErrors: true,
  })

  // Register the standard formats, then any caller-provided extras.
  addFormats(ajv)

  if (formats) {
    for (const [name, definition] of Object.entries(formats)) {
      ajv.addFormat(name, definition as never)
    }
  }

  return ajv.compile(schema)
}

/**
 * Compiled validators cached by schema identity. Compiling a schema is
 * expensive, so repeat validations of the same schema object reuse the result.
 */
const compiledValidators = new WeakMap<SchemaObject, ValidateFunction>()

/**
 * Schemas that failed to compile, and why. Cached alongside the successes so a
 * broken schema fails fast instead of paying the full Ajv setup cost per call.
 */
const failedCompilations = new WeakMap<SchemaObject, unknown>()

const toMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error))

const runValidation = (
  validateFn: ValidateFunction,
  document: unknown,
  options?: ValidateOptions,
): ValidationResult => {
  let value: unknown

  if (typeof document === 'string') {
    // A malformed JSON/YAML string is a validation failure like any other, so it
    // has to respect `throwOnError` rather than escaping as a parser exception.
    try {
      value = parseYaml(document)
    } catch (error) {
      if (options?.throwOnError) {
        throw error
      }

      return { valid: false, errors: [{ message: toMessage(error) }] }
    }
  } else {
    value = document
  }

  if (validateFn(value)) {
    return { valid: true, errors: [] }
  }

  const errors = transformErrors(value as AnyObject, (validateFn.errors ?? []) as AjvError[])

  if (options?.throwOnError) {
    throw new Error(errors[0]?.message ?? 'Validation failed')
  }

  return { valid: false, errors }
}

/**
 * Compiles a JSON Schema once and returns a reusable validator function.
 *
 * Prefer this when validating many documents against the same schema.
 *
 * Compiling happens up front, so a schema Ajv cannot compile throws from this
 * call rather than from the returned function. Use `validate` instead when a
 * schema is untrusted and an uncompilable one should come back as a result.
 */
export function createValidator(schema: SchemaObject, options?: CreateValidatorOptions) {
  const validateFn = compile(schema, options?.formats)

  return (document: unknown, callOptions?: ValidateOptions): ValidationResult =>
    runValidation(validateFn, document, callOptions)
}

/**
 * Validates a document against a JSON Schema.
 *
 * The document can be an object, or a JSON or YAML string. Compiled schemas are
 * cached by identity, so passing the same schema object again is cheap. Because
 * of that cache, `formats` only take effect the first time a given schema object
 * is validated; reuse `createValidator` when you need per-schema formats.
 */
export function validate(
  document: unknown,
  schema: SchemaObject,
  options?: ValidateOptions & CreateValidatorOptions,
): ValidationResult {
  // Booleans are valid JSON Schemas but cannot key a WeakMap, so they skip the
  // caches entirely rather than throwing.
  const isCacheable = typeof schema === 'object' && schema !== null

  if (isCacheable && failedCompilations.has(schema)) {
    const previousFailure = failedCompilations.get(schema)

    if (options?.throwOnError) {
      throw previousFailure
    }

    return { valid: false, errors: [{ message: toMessage(previousFailure) }] }
  }

  let validateFn = compiledValidators.get(schema)

  if (!validateFn) {
    // A schema that cannot be compiled (a malformed `pattern`, an unresolvable
    // `$ref`, an unknown dialect) is reported like any other failure, so
    // `throwOnError: false` keeps its promise not to throw.
    try {
      validateFn = compile(schema, options?.formats)
    } catch (error) {
      if (isCacheable) {
        failedCompilations.set(schema, error)
      }

      if (options?.throwOnError) {
        throw error
      }

      return { valid: false, errors: [{ message: toMessage(error) }] }
    }

    if (isCacheable) {
      compiledValidators.set(schema, validateFn)
    }
  }

  return runValidation(validateFn, document, options)
}
