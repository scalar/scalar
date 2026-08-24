import type { AnyObject } from '@scalar/types/utils'
import Ajv, { type ValidateFunction } from 'ajv'
import Ajv2020 from 'ajv/dist/2020.js'
import Ajv04 from 'ajv-draft-04'
import addFormats from 'ajv-formats'
import { parse as parseYaml } from 'yaml'

import type { AjvError } from '@/prettify-ajv-errors'
import { transformErrors } from '@/transform-errors'
import type { ValidateOptions, ValidationResult } from '@/types'

type SchemaObject = Record<string, any>

/**
 * Ajv classes keyed by the JSON Schema dialect a schema declares in `$schema`.
 */
const ajvClassesByDialect = {
  'http://json-schema.org/draft-04/schema#': Ajv04,
  'http://json-schema.org/draft-07/schema#': Ajv,
  'https://json-schema.org/draft/2020-12/schema': Ajv2020,
}

const compile = (schema: SchemaObject, formats?: Record<string, unknown>): ValidateFunction => {
  const AjvClass = ajvClassesByDialect[schema.$schema as keyof typeof ajvClassesByDialect] ?? Ajv

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

const runValidation = (
  validateFn: ValidateFunction,
  document: unknown,
  options?: ValidateOptions,
): ValidationResult => {
  const value = typeof document === 'string' ? parseYaml(document) : document

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
 */
export function createValidator(schema: SchemaObject, options?: Pick<ValidateOptions, 'formats'>) {
  const validateFn = compile(schema, options?.formats)

  return (document: unknown, callOptions?: ValidateOptions): ValidationResult =>
    runValidation(validateFn, document, callOptions)
}

/**
 * Validates a document against a JSON Schema.
 *
 * The document can be an object, or a JSON or YAML string. Compiled schemas are
 * cached by identity, so passing the same schema object again is cheap.
 */
export function validate(document: unknown, schema: SchemaObject, options?: ValidateOptions): ValidationResult {
  let validateFn = compiledValidators.get(schema)

  if (!validateFn) {
    validateFn = compile(schema, options?.formats)
    compiledValidators.set(schema, validateFn)
  }

  return runValidation(validateFn, document, options)
}
