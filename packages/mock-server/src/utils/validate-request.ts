import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import type { ErrorObject, ValidateFunction } from 'ajv'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import type { Context, MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'

import {
  type ParameterLocation,
  deserializeArrayParameter,
  deserializeObjectParameter,
  isArraySchema,
  isObjectSchema,
  resolveSerialization,
} from './deserialize-parameter'

/** Where a validation violation was found in the request */
type ViolationLocation = 'body' | 'query' | 'path' | 'header' | 'cookie'

/** A declared parameter, describing how to read and deserialize its value from the request */
type ParameterDescriptor = {
  name: string
  /** Resolved serialization style (for example `form`, `simple`, `pipeDelimited`) */
  style: string
  /** Resolved `explode` flag, applying the OpenAPI default for the style */
  explode: boolean
  /** Whether the parameter schema is an array, which needs delimiter-aware deserialization */
  isArray: boolean
  /** Whether the parameter schema is an object, which needs key/value deserialization */
  isObject: boolean
  /** Declared object property names, used to gather exploded `form` objects from the query map */
  propertyNames: string[]
}

/** A single request validation violation, mapped from an Ajv error */
type Violation = {
  location: ViolationLocation
  /** JSON pointer into the offending value (e.g. `/limit`), empty for top-level errors */
  path: string
  message: string
}

/** The validators compiled once per operation and reused across every request */
type CompiledValidators = {
  path: ValidateFunction | null
  query: ValidateFunction | null
  header: ValidateFunction | null
  cookie: ValidateFunction | null
  /** Declared parameters per location, used to gather and deserialize their values from the request */
  pathParameters: ParameterDescriptor[]
  queryParameters: ParameterDescriptor[]
  headerParameters: ParameterDescriptor[]
  cookieParameters: ParameterDescriptor[]
  body: ValidateFunction | null
  /** Whether the request body is required by the operation */
  bodyRequired: boolean
}

/**
 * Header parameters named `Accept`, `Content-Type`, or `Authorization` are defined elsewhere in
 * OpenAPI (through `content` and `security`), so the spec says such parameter definitions SHALL be
 * ignored. We compare case-insensitively because header names are case-insensitive.
 */
const IGNORED_HEADER_PARAMETERS = new Set(['accept', 'content-type', 'authorization'])

/**
 * Build a JSON Schema object for the parameters declared `in` the given location, alongside a
 * descriptor for each declared parameter.
 *
 * Parameters arrive as strings, so the caller compiles these with `coerceTypes: true` to let
 * `type: integer`/`boolean` validate correctly. The descriptors let the middleware gather only
 * declared values and deserialize array parameters by their `style`/`explode`. Returns `null` when
 * there is nothing to validate.
 */
const buildParameterSchema = (
  parameters: OpenAPIV3_1.OperationObject['parameters'],
  location: ParameterLocation,
): { schema: Record<string, unknown>; parameters: ParameterDescriptor[] } | null => {
  const properties: Record<string, unknown> = {}
  const required: string[] = []
  const descriptors: ParameterDescriptor[] = []

  for (const parameterOrRef of parameters ?? []) {
    const parameter = getResolvedRef(parameterOrRef)

    if (parameter?.in !== location) {
      continue
    }

    // Per the OpenAPI spec, these header parameters are defined elsewhere and ignored as parameters.
    if (location === 'header' && IGNORED_HEADER_PARAMETERS.has(parameter.name.toLowerCase())) {
      continue
    }

    const resolvedSchema = parameter.schema
      ? (getResolvedRefDeep(parameter.schema) as Record<string, unknown>)
      : undefined
    const { style, explode } = resolveSerialization(location, parameter.style, parameter.explode)

    // Property names let exploded `form` objects be gathered from matching top-level query keys.
    const schemaProperties = resolvedSchema?.properties as Record<string, unknown> | undefined
    const propertyNames = schemaProperties ? Object.keys(schemaProperties) : []

    descriptors.push({
      name: parameter.name,
      style,
      explode,
      isArray: isArraySchema(resolvedSchema),
      isObject: isObjectSchema(resolvedSchema),
      propertyNames,
    })

    if (resolvedSchema) {
      properties[parameter.name] = resolvedSchema
    }

    if (parameter.required) {
      required.push(parameter.name)
    }
  }

  if (Object.keys(properties).length === 0 && required.length === 0) {
    return null
  }

  // Allow undeclared parameters to pass through; we only enforce what the operation declares.
  return { schema: { type: 'object', properties, required, additionalProperties: true }, parameters: descriptors }
}

/**
 * Merge path-item-level parameters with operation-level parameters.
 *
 * OpenAPI allows declaring `parameters` on the path item, where they apply to every operation under
 * it. Operation-level parameters override path-item ones that share the same name and location.
 */
const mergeParameters = (
  pathItemParameters: OpenAPIV3_1.PathItemObject['parameters'],
  operationParameters: OpenAPIV3_1.OperationObject['parameters'],
): OpenAPIV3_1.OperationObject['parameters'] => {
  const byKey = new Map<string, NonNullable<OpenAPIV3_1.OperationObject['parameters']>[number]>()

  // Guard against malformed documents where `parameters` is not an array.
  const pathItemList = Array.isArray(pathItemParameters) ? pathItemParameters : []
  const operationList = Array.isArray(operationParameters) ? operationParameters : []

  // Path-item parameters come first so that operation-level entries overwrite them by identity.
  for (const parameterOrRef of [...pathItemList, ...operationList]) {
    const parameter = getResolvedRef(parameterOrRef)

    if (!parameter?.name || !parameter.in) {
      continue
    }

    byKey.set(`${parameter.in}:${parameter.name}`, parameterOrRef)
  }

  return [...byKey.values()]
}

/**
 * Compile a single schema, failing open if it cannot compile.
 *
 * A malformed or uncompilable schema must not crash the server: we log and skip validation for that
 * part only, consistent with how `x-seed` errors are swallowed during setup. Each schema is compiled
 * in isolation so one broken schema never disables the others.
 */
const compileSchema = (
  ajv: Ajv2020,
  schema: Record<string, unknown> | null,
  label: string,
): ValidateFunction | null => {
  if (!schema) {
    return null
  }

  try {
    return ajv.compile(schema)
  } catch (error) {
    console.error(`Error compiling ${label} validator, skipping validation for it:`, error)
    return null
  }
}

/**
 * Compile the validators for a single operation once, so they can be reused on every request.
 */
const compileValidators = (
  operation: OpenAPIV3_1.OperationObject,
  pathItemParameters: OpenAPIV3_1.PathItemObject['parameters'],
): CompiledValidators => {
  // Coerce string parameters to their declared types (integer, boolean, …).
  const parameterAjv = new Ajv2020({ strict: false, allErrors: true, coerceTypes: true })
  addFormats(parameterAjv)

  // Do not coerce the JSON body; a JSON value already carries its type and coercion would mask errors.
  const bodyAjv = new Ajv2020({ strict: false, allErrors: true })
  addFormats(bodyAjv)

  // Path-item parameters apply to every operation, so fold them in before building the schemas.
  const parameters = mergeParameters(pathItemParameters, operation.parameters)

  const pathParameters = buildParameterSchema(parameters, 'path')
  const queryParameters = buildParameterSchema(parameters, 'query')
  const headerParameters = buildParameterSchema(parameters, 'header')
  const cookieParameters = buildParameterSchema(parameters, 'cookie')

  const requestBody = getResolvedRef(operation.requestBody)
  // Build the body schema defensively; resolving a malformed `$ref` should not crash setup.
  let bodySchema: Record<string, unknown> | null = null
  try {
    const jsonSchema = getResolvedRef(requestBody?.content?.['application/json'])?.schema
    bodySchema = jsonSchema ? (getResolvedRefDeep(jsonSchema) as Record<string, unknown>) : null
  } catch (error) {
    console.error('Error resolving request body schema, skipping body validation:', error)
  }

  return {
    path: compileSchema(parameterAjv, pathParameters?.schema ?? null, 'path parameter'),
    query: compileSchema(parameterAjv, queryParameters?.schema ?? null, 'query parameter'),
    header: compileSchema(parameterAjv, headerParameters?.schema ?? null, 'header parameter'),
    cookie: compileSchema(parameterAjv, cookieParameters?.schema ?? null, 'cookie parameter'),
    pathParameters: pathParameters?.parameters ?? [],
    queryParameters: queryParameters?.parameters ?? [],
    headerParameters: headerParameters?.parameters ?? [],
    cookieParameters: cookieParameters?.parameters ?? [],
    body: compileSchema(bodyAjv, bodySchema, 'request body'),
    // Required-body enforcement is independent of whether the body schema compiles.
    bodyRequired: requestBody?.required === true,
  }
}

/**
 * Map Ajv errors into our violation shape. For non-body parameters (path, query, header, cookie) the
 * offending parameter name is prepended to the message so the response is readable without
 * cross-referencing the pointer.
 */
const mapErrors = (errors: ErrorObject[] | null | undefined, location: ViolationLocation): Violation[] =>
  (errors ?? []).map((error) => {
    const missingProperty =
      typeof error.params === 'object' && error.params && 'missingProperty' in error.params
        ? String((error.params as { missingProperty?: string }).missingProperty)
        : ''
    const path = error.instancePath || (missingProperty ? `/${missingProperty}` : '')

    const name = error.instancePath.replace(/^\//, '') || missingProperty
    const message = location !== 'body' && name ? `${name} ${error.message ?? ''}`.trim() : (error.message ?? '')

    return { location, path, message }
  })

/**
 * Detect whether the request body should be treated as JSON. We only validate JSON bodies in this
 * slice; an empty/absent Content-Type is treated as JSON to stay forgiving. This intentionally
 * mirrors how `build-handler-context` parses the body, so we never validate a body the handler then
 * fails to deliver as `req.body`.
 */
const isJsonRequest = (c: Context): boolean => {
  const contentType = c.req.header('Content-Type')?.toLowerCase() ?? ''
  return contentType === '' || contentType.includes('application/json')
}

/**
 * Create a Hono middleware bound to a single resolved operation that enforces its request contract.
 *
 * Validators are compiled once here (at route-setup time) and reused on every request. On any
 * violation the middleware short-circuits with a `422` and a `application/problem+json` body;
 * otherwise it calls `next()` and the normal mock handler runs.
 *
 * TODO: Parity follow-ups, intentionally deferred — the rarer `label`/`matrix` path styles, response
 * validation, non-JSON body validation, and validation proxy mode.
 */
export const validateRequest = (
  operation: OpenAPIV3_1.OperationObject,
  pathItemParameters?: OpenAPIV3_1.PathItemObject['parameters'],
): MiddlewareHandler => {
  const validators = compileValidators(operation, pathItemParameters)

  return async (c, next): Promise<Response | void> => {
    const violations: Violation[] = []

    /**
     * Gather declared parameter values for one location into a plain object for validation. Array and
     * object parameters are deserialized by their `style`/`explode`; everything else is read as a
     * single string. Values are looked up by declared name (rather than dumping every request value)
     * so header names match case-insensitively and only declared parameters are enforced.
     *
     * `getValues` (repeated query keys) and `queryMap` (the full query map) are only supplied for the
     * query location, where exploded arrays and `deepObject`/exploded-`form` objects need them.
     */
    const gather = (
      descriptors: ParameterDescriptor[],
      getValue: (name: string) => string | undefined,
      getValues?: (name: string) => string[] | undefined,
      queryMap?: () => Record<string, string>,
    ): Record<string, unknown> => {
      const data: Record<string, unknown> = {}
      for (const descriptor of descriptors) {
        let value: unknown
        if (descriptor.isArray) {
          value = deserializeArrayParameter({
            style: descriptor.style,
            explode: descriptor.explode,
            single: getValue(descriptor.name),
            multi: getValues?.(descriptor.name),
          })
        } else if (descriptor.isObject) {
          value = deserializeObjectParameter({
            style: descriptor.style,
            explode: descriptor.explode,
            single: getValue(descriptor.name),
            query: queryMap?.(),
            name: descriptor.name,
            propertyNames: descriptor.propertyNames,
          })
        } else {
          value = getValue(descriptor.name)
        }
        if (value !== undefined) {
          data[descriptor.name] = value
        }
      }
      return data
    }

    // Path parameters (coerced from strings)
    if (validators.path) {
      const data = gather(validators.pathParameters, (name) => c.req.param(name))
      if (!validators.path(data)) {
        violations.push(...mapErrors(validators.path.errors, 'path'))
      }
    }

    // Query parameters (coerced from strings; repeated keys feed exploded arrays, the query map feeds objects)
    if (validators.query) {
      const data = gather(
        validators.queryParameters,
        (name) => c.req.query(name),
        (name) => c.req.queries(name),
        () => c.req.query(),
      )
      if (!validators.query(data)) {
        violations.push(...mapErrors(validators.query.errors, 'query'))
      }
    }

    // Header parameters (coerced from strings; names are case-insensitive)
    if (validators.header) {
      const data = gather(validators.headerParameters, (name) => c.req.header(name))
      if (!validators.header(data)) {
        violations.push(...mapErrors(validators.header.errors, 'header'))
      }
    }

    // Cookie parameters (coerced from strings)
    if (validators.cookie) {
      const data = gather(validators.cookieParameters, (name) => getCookie(c, name))
      if (!validators.cookie(data)) {
        violations.push(...mapErrors(validators.cookie.errors, 'cookie'))
      }
    }

    // Request body — only `application/json` in this slice
    if (validators.body || validators.bodyRequired) {
      // Read from a clone so the original request stream stays intact for the mock or `x-handler`
      // downstream. Consuming `c.req.text()` directly would leave `c.req.parseBody()` (used for
      // form bodies) unable to reconstruct the body, so handlers would see it as undefined.
      const raw = await c.req.raw.clone().text()

      if (!raw) {
        if (validators.bodyRequired) {
          violations.push({ location: 'body', path: '', message: 'Request body is required' })
        }
      } else if (validators.body && isJsonRequest(c)) {
        try {
          const parsed: unknown = JSON.parse(raw)
          if (!validators.body(parsed)) {
            violations.push(...mapErrors(validators.body.errors, 'body'))
          }
        } catch {
          // The client sent a non-empty JSON body that cannot be parsed, so it cannot satisfy the
          // schema regardless of whether the body is required.
          violations.push({ location: 'body', path: '', message: 'Request body must be valid JSON' })
        }
      }
    }

    if (violations.length > 0) {
      // Use `c.body` (not `c.json`) so the `application/problem+json` content type is preserved;
      // `c.json` would force `application/json`.
      return c.body(JSON.stringify({ error: 'Request validation failed', violations }), 422, {
        'Content-Type': 'application/problem+json',
      })
    }

    await next()
  }
}
