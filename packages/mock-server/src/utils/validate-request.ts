import { getFirstMediaType } from '@scalar/helpers/http/get-first-media-type'
import { isJsonMediaType } from '@scalar/helpers/http/is-json-media-type'
import { type ParsedMimeType, parseMimeType } from '@scalar/helpers/http/mime-type'
import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { useDecimalMultipleOf } from '@scalar/json-schema-validator/decimal-multiple-of'
import type { OpenAPIV3_1, OpenAPIV3_2 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import type { ErrorObject, Options, ValidateFunction } from 'ajv'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'

import { pathParameters } from '@/utils/path-parameters'

import { compilePattern } from './compile-pattern'
import {
  type ParameterLocation,
  deserializeArrayParameter,
  deserializeObjectParameter,
  deserializePrimitiveParameter,
  getObjectPropertyNames,
  isArraySchema,
  isObjectSchema,
  resolveSerialization,
} from './deserialize-parameter'
import { dropReadOnlyRequired } from './drop-read-only-required'
import { isJsonContentType } from './is-json-content-type'
import { findQuerystringParameter, getQuerystringJsonSchema, parseQuerystringParameter } from './querystring-parameter'
import { replaceCircularMarkers } from './replace-circular-markers'

/**
 * Prepare a resolved schema for Ajv by replacing the `'[circular]'` markers a recursive schema leaves
 * behind. Ajv refuses to compile a schema that still carries one, which makes the body — or the whole
 * parameter location built around it — fail open.
 *
 * Only Ajv sees this copy. Everything that reads the *shape* of a schema keeps reading the resolved
 * one, because the rewrite may drop a keyword (a `oneOf` the cycle ran through, say) that the shape
 * still depends on.
 */
const asCompilableSchema = (resolved: unknown): Record<string, unknown> | boolean =>
  replaceCircularMarkers(resolved) as Record<string, unknown> | boolean

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

/** A parameter whose entire wire value is represented by one media type. */
type ContentParameter = { name: string; required: boolean; isJson: boolean; validate: ValidateFunction | null }

type ParameterValidators = {
  styled: ParameterDescriptor[]
  validateStyled: ValidateFunction | null
  content: ContentParameter[]
}

/** A single request validation violation, mapped from an Ajv error */
type Violation = {
  location: ViolationLocation
  /** JSON pointer into the offending value (e.g. `/limit`), empty for top-level errors */
  path: string
  message: string
}

type BodyValidators = {
  headerless: ValidateFunction | null
  mediaTypes: { mediaType: ParsedMimeType; specificity: number; validate: ValidateFunction | null }[]
}

/** The validators compiled once per operation and reused across every request */
type CompiledValidators = {
  parameters: Record<ParameterLocation, ParameterValidators>
  querystringJson: ValidateFunction | null
  querystring: ValidateFunction | null
  querystringParameter: OpenAPIV3_2.ParameterObject | undefined
  body: BodyValidators
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
 * Collapse a `key -> string[]` map (as returned by Hono's `c.req.queries()`) into a `key -> string |
 * string[]` map: a single value becomes a plain string, while repeated keys keep their array so
 * array-valued object properties are not silently truncated to the first value.
 */
const mapRepeatedValues = (values: Record<string, string[]>): Record<string, string | string[]> => {
  const map: Record<string, string | string[]> = {}
  for (const [key, list] of Object.entries(values)) {
    map[key] = list.length > 1 ? list : (list[0] ?? '')
  }
  return map
}

/**
 * Compile styled parameters together for string coercion, and content parameters separately
 * so their media type determines how to read and validate the value.
 */
const compileParameters = (
  parameters: OpenAPIV3_1.OperationObject['parameters'],
  location: ParameterLocation,
  parameterAjv: Ajv2020,
  getContentAjv: (coerceTypes: boolean) => Ajv2020,
): ParameterValidators => {
  const properties: Record<string, unknown> = {}
  const required: string[] = []
  const styled: ParameterDescriptor[] = []
  const content: ContentParameter[] = []

  for (const parameterOrRef of parameters ?? []) {
    const parameter = getResolvedRef(parameterOrRef)

    if (parameter?.in !== location) {
      continue
    }

    // Per the OpenAPI spec, these header parameters are defined elsewhere and ignored as parameters.
    if (location === 'header' && IGNORED_HEADER_PARAMETERS.has(parameter.name.toLowerCase())) {
      continue
    }

    const entry = parameter.schema === undefined && getFirstMediaType<OpenAPIV3_1.MediaTypeObject>(parameter.content)
    if (entry) {
      const [contentType, media] = entry
      const mediaType = parseMimeType(contentType).essence
      const isJson = isJsonMediaType(mediaType)
      const schema: unknown = getResolvedRefDeep(getResolvedRef(media)?.schema)
      // Other media types have no decoder here. Presence and a false schema still apply.
      const validate =
        schema !== undefined && (isJson || mediaType === 'text/plain' || schema === false)
          ? compileSchema(
              getContentAjv(mediaType === 'text/plain'),
              dropReadOnlyRequired(asCompilableSchema(schema)) as Record<string, unknown> | boolean,
              `${location} parameter ${parameter.name}`,
            )
          : null
      content.push({ name: parameter.name, required: parameter.required === true, isJson, validate })
      continue
    }

    const resolvedSchema = parameter.schema
      ? (getResolvedRefDeep(parameter.schema) as Record<string, unknown>)
      : undefined
    const { style, explode } = resolveSerialization(location, parameter.style, parameter.explode)

    // Property names let exploded `form` objects be gathered from matching top-level query keys. They
    // are collected through any `anyOf`/`oneOf`/`allOf` composition so a composed object schema does not
    // fall back to free-form gathering and claim unrelated keys.
    styled.push({
      name: parameter.name,
      style,
      explode,
      isArray: isArraySchema(resolvedSchema),
      isObject: isObjectSchema(resolvedSchema),
      propertyNames: getObjectPropertyNames(resolvedSchema),
    })

    if (resolvedSchema) {
      properties[parameter.name] = asCompilableSchema(resolvedSchema)
    }

    if (parameter.required) {
      required.push(parameter.name)
    }
  }

  // Allow undeclared parameters to pass through; we only enforce what the operation declares.
  const schema =
    Object.keys(properties).length > 0 || required.length > 0
      ? { type: 'object', properties, required, additionalProperties: true }
      : null
  return { styled, content, validateStyled: compileSchema(parameterAjv, schema, `${location} parameter`) }
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
  schema: Record<string, unknown> | boolean | null | undefined,
  label: string,
): ValidateFunction | null => {
  if (schema === null || schema === undefined) {
    return null
  }

  try {
    return ajv.compile(schema)
  } catch (error) {
    console.error(`Error compiling ${label} validator, skipping validation for it:`, error)
    return null
  }
}

/** Apply the same formats and pattern handling to every request validator. */
const createRequestAjv = (options: Options = {}): Ajv2020 => {
  const ajv = new Ajv2020({ strict: false, allErrors: true, code: { regExp: compilePattern }, ...options })
  useDecimalMultipleOf(ajv)
  addFormats(ajv)
  return ajv
}

/** Compile each JSON media type and each range that may describe a JSON request. */
const compileBodyValidators = (content: OpenAPIV3_1.RequestBodyObject['content']): BodyValidators => {
  if (!content) {
    return { headerless: null, mediaTypes: [] }
  }

  // Independently resolved schemas can share an ID across media types.
  const ajv = createRequestAjv({ addUsedSchema: false })
  const mediaTypes: BodyValidators['mediaTypes'] = []
  for (const [key, media] of Object.entries(content)) {
    const mediaType = parseMimeType(key)
    if (mediaType.subtype !== '*' && !isJsonContentType(mediaType)) {
      continue
    }

    let validate: ValidateFunction | null = null
    try {
      const schema = getResolvedRef(media)?.schema
      if (schema !== undefined) {
        validate = compileSchema(
          ajv,
          dropReadOnlyRequired(asCompilableSchema(getResolvedRefDeep(schema))) as Record<string, unknown> | boolean,
          `request body for ${key}`,
        )
      }
    } catch (error) {
      console.error(`Error resolving request body schema for ${key}, skipping its validation:`, error)
    }

    // Keep entries without a validator so a more general range cannot override them.
    const specificity = Number(mediaType.type !== '*') + Number(mediaType.subtype !== '*')
    mediaTypes.push({ mediaType, specificity, validate })
  }

  // Prefer the original bare JSON declaration for clients that omit the header.
  const headerless =
    mediaTypes.find(({ mediaType }) => mediaType.essence === 'application/json' && mediaType.parameters.size === 0) ??
    mediaTypes.find(({ mediaType }) => mediaType.essence === 'application/json') ??
    mediaTypes.find(({ mediaType }) => mediaType.subtype.endsWith('+json'))

  return {
    headerless: headerless?.validate ?? null,
    mediaTypes: mediaTypes.sort(
      (a, b) => b.specificity - a.specificity || b.mediaType.parameters.size - a.mediaType.parameters.size,
    ),
  }
}

/** An exact media type takes precedence over matching ranges, even when it has no schema. */
const selectBodyValidator = (validators: BodyValidators, contentType: string | undefined): ValidateFunction | null => {
  if (!contentType?.trim()) {
    return validators.headerless
  }
  const request = parseMimeType(contentType)
  if (!isJsonContentType(request)) {
    return null
  }

  const match = validators.mediaTypes.find(({ mediaType }) => {
    if (mediaType.type !== '*' && mediaType.type !== request.type) {
      return false
    }
    if (mediaType.subtype !== '*' && mediaType.subtype !== request.subtype) {
      return false
    }

    return Array.from(mediaType.parameters).every(([name, value]) => {
      const actual = request.parameters.get(name)
      return name === 'charset' ? actual?.toLowerCase() === value.toLowerCase() : actual === value
    })
  })
  return match?.validate ?? null
}

/** Compile the validators for a single operation once, so they can be reused on every request. */
const compileValidators = (
  operation: OpenAPIV3_1.OperationObject,
  pathItemParameters: OpenAPIV3_1.PathItemObject['parameters'],
): CompiledValidators => {
  // Coerce string parameters to their declared types (integer, boolean, …).
  const parameterAjv = createRequestAjv({ coerceTypes: true })
  const querystringAjv = createRequestAjv()
  const contentAjv = new Map<boolean, Ajv2020>()
  const getContentAjv = (coerceTypes: boolean): Ajv2020 => {
    const existing = contentAjv.get(coerceTypes)
    if (existing) {
      return existing
    }
    // Standalone content validators can reference the same component without registering its ID twice.
    const ajv = createRequestAjv({ coerceTypes, addUsedSchema: false, ownProperties: true })
    contentAjv.set(coerceTypes, ajv)
    return ajv
  }

  // Path-item parameters apply to every operation, so fold them in before building the schemas.
  const parameters = mergeParameters(pathItemParameters, operation.parameters)

  const querystringParameter = findQuerystringParameter(operation, pathItemParameters)
  const [querystringContentType, querystringMedia] = getFirstMediaType(querystringParameter?.content) ?? []
  const querystringSchema = querystringMedia?.schema

  const requestBody = getResolvedRef(operation.requestBody)

  return {
    querystringParameter,
    querystringJson: compileSchema(
      querystringAjv,
      getQuerystringJsonSchema(querystringParameter),
      'querystring JSON properties',
    ),
    querystring: compileSchema(
      parseMimeType(querystringContentType).essence === 'application/x-www-form-urlencoded'
        ? parameterAjv
        : querystringAjv,
      querystringSchema === undefined ? null : asCompilableSchema(getResolvedRefDeep(querystringSchema)),
      'querystring parameter',
    ),
    parameters: {
      path: compileParameters(parameters, 'path', parameterAjv, getContentAjv),
      query: compileParameters(parameters, 'query', parameterAjv, getContentAjv),
      header: compileParameters(parameters, 'header', parameterAjv, getContentAjv),
      cookie: compileParameters(parameters, 'cookie', parameterAjv, getContentAjv),
    },
    body: compileBodyValidators(requestBody?.content),
    // Required-body enforcement is independent of whether the body schema compiles.
    bodyRequired: requestBody?.required === true,
  }
}

/**
 * Map Ajv errors into our violation shape. For non-body parameters (path, query, header, cookie) the
 * offending parameter name is prepended to the message so the response is readable without
 * cross-referencing the pointer.
 */
const mapErrors = (errors: ErrorObject[] | null | undefined, location: ViolationLocation, prefix = ''): Violation[] =>
  (errors ?? []).map((error) => {
    const missingProperty =
      typeof error.params === 'object' && error.params && 'missingProperty' in error.params
        ? String((error.params as { missingProperty?: string }).missingProperty)
        : ''
    const instancePath = prefix + error.instancePath
    const path = instancePath || (missingProperty ? `/${missingProperty}` : '')

    // A missing parameter surfaces as a top-level `required` error whose `missingProperty` is the
    // parameter name. Phrase it as "<name> is required" instead of the confusing, self-referential
    // "<name> must have required property '<name>'" that Ajv produces against the synthetic wrapper.
    if (location !== 'body' && missingProperty && !instancePath) {
      return { location, path, message: `${missingProperty} is required` }
    }

    const name = instancePath.replace(/^\//, '') || missingProperty
    const message = location !== 'body' && name ? `${name} ${error.message ?? ''}`.trim() : (error.message ?? '')

    return { location, path, message }
  })

/**
 * Create a Hono middleware bound to a single resolved operation that enforces its request contract.
 *
 * Validators are compiled once here (at route-setup time) and reused on every request. On any
 * violation the middleware short-circuits with a `422` and a `application/problem+json` body;
 * otherwise it calls `next()` and the normal mock handler runs.
 *
 * TODO: Parity follow-ups, intentionally deferred — response validation, non-JSON body validation,
 * and validation proxy mode.
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
     * `getValues` (repeated query keys) is only supplied for the query location, where exploded arrays
     * need it. `getMap` returns the full key/value map for the location and is supplied for query and
     * cookie, where exploded-`form` objects (and query `deepObject`) spread properties across keys —
     * for cookies each object property is its own cookie (`Cookie: r=100; g=200`).
     */
    const gather = (
      descriptors: ParameterDescriptor[],
      declaredNames: Set<string>,
      getValue: (name: string) => string | undefined,
      getValues?: (name: string) => string[] | undefined,
      getMap?: () => Record<string, string | string[]>,
    ): Record<string, unknown> => {
      const readAsObject = (descriptor: ParameterDescriptor): unknown =>
        deserializeObjectParameter({
          style: descriptor.style,
          explode: descriptor.explode,
          single: getValue(descriptor.name),
          map: getMap?.(),
          name: descriptor.name,
          propertyNames: descriptor.propertyNames,
          reservedKeys: declaredNames,
        })

      const readAsArray = (descriptor: ParameterDescriptor): unknown =>
        deserializeArrayParameter({
          style: descriptor.style,
          explode: descriptor.explode,
          single: getValue(descriptor.name),
          multi: getValues?.(descriptor.name),
        })

      const data: Record<string, unknown> = {}
      for (const descriptor of descriptors) {
        let value: unknown
        if (descriptor.isArray && descriptor.isObject) {
          // A schema composed with `anyOf`/`oneOf`/`allOf` can look like both an array and an object, and
          // form encoding cannot say which the client meant. Prefer a non-empty array — that only happens
          // when the request carries the parameter's own (possibly repeated) key — and fall back to the
          // object reading otherwise. This parses array-style input (`?filter=1&filter=2`) as an array while
          // still letting object-style input (properties spread across other keys) be gathered as an object.
          // A lone empty value (`?filter=`) deserializes to `[]`, which is not array-shaped input, so it must
          // not short-circuit the object fallback; the empty array is only kept when no object value is found.
          const asArray = readAsArray(descriptor)
          value = Array.isArray(asArray) && asArray.length > 0 ? asArray : (readAsObject(descriptor) ?? asArray)
        } else if (descriptor.isObject) {
          value = readAsObject(descriptor)
        } else if (descriptor.isArray) {
          value = readAsArray(descriptor)
        } else {
          value = deserializePrimitiveParameter({
            style: descriptor.style,
            single: getValue(descriptor.name),
            name: descriptor.name,
          })
        }
        if (value !== undefined) {
          data[descriptor.name] = value
        }
      }
      return data
    }

    // Validate each parameter location with its own request accessors. Values are coerced from strings.
    // The differences between locations are only the accessors:
    //  - query supplies `getValues` (repeated keys feed exploded arrays) and a `getMap` that keeps
    //    repeated keys as arrays, so an array-valued object property (`filter[tags]=a&filter[tags]=b`)
    //    survives deserialization;
    //  - cookie supplies a `getMap` (each exploded `form` object property is its own cookie);
    //  - header names are matched case-insensitively by Hono's `c.req.header`.
    const requestPathParameters = pathParameters(c)
    const parameterLocations: Array<{
      location: ParameterLocation
      getValue: (name: string) => string | undefined
      getValues?: (name: string) => string[] | undefined
      getMap?: () => Record<string, string | string[]>
    }> = [
      {
        location: 'path',
        getValue: (name) => requestPathParameters[name],
      },
      {
        location: 'query',
        getValue: (name) => c.req.query(name),
        getValues: (name) => c.req.queries(name),
        getMap: () => mapRepeatedValues(c.req.queries()),
      },
      {
        location: 'header',
        getValue: (name) => c.req.header(name),
      },
      {
        location: 'cookie',
        getValue: (name) => getCookie(c, name),
        getMap: () => getCookie(c),
      },
    ]

    for (const { location, getValue, getValues, getMap } of parameterLocations) {
      const { styled, validateStyled, content } = validators.parameters[location]
      if (validateStyled) {
        // Reserve named content values so an exploded object cannot consume a sibling parameter.
        const declaredNames = new Set([...styled, ...content].map(({ name }) => name))
        if (!validateStyled(gather(styled, declaredNames, getValue, getValues, getMap))) {
          violations.push(...mapErrors(validateStyled.errors, location))
        }
      }
      for (const { name, required, isJson, validate } of content) {
        const raw = getValue(name)
        const path = `/${escapeJsonPointer(name)}`
        if (typeof raw !== 'string') {
          if (required) {
            violations.push({ location, path, message: `${name} is required` })
          }
          continue
        }

        let value: unknown = raw
        if (isJson) {
          try {
            value = JSON.parse(raw)
          } catch {
            violations.push({ location, path, message: `${name} must be valid JSON` })
            continue
          }
        }
        if (validate && !validate(value)) {
          violations.push(...mapErrors(validate.errors, location, path))
        }
      }
    }

    if (validators.querystringParameter) {
      try {
        const value = parseQuerystringParameter(c.req.url, validators.querystringParameter)
        if (value === undefined) {
          if (validators.querystringParameter.required) {
            violations.push({ location: 'query', path: '', message: 'Query string is required' })
          }
        } else if (validators.querystringJson && !validators.querystringJson(value)) {
          violations.push(...mapErrors(validators.querystringJson.errors, 'query'))
        } else if (validators.querystring && !validators.querystring(value)) {
          violations.push(...mapErrors(validators.querystring.errors, 'query'))
        }
      } catch {
        violations.push({ location: 'query', path: '', message: 'Query string could not be decoded' })
      }
    }

    const validateBody = selectBodyValidator(validators.body, c.req.header('Content-Type'))
    if (validateBody || validators.bodyRequired) {
      // Read from a clone so the original request stream stays intact for the mock or `x-handler`
      // downstream. Consuming `c.req.text()` directly would leave `c.req.parseBody()` (used for
      // form bodies) unable to reconstruct the body, so handlers would see it as undefined.
      const raw = await c.req.raw.clone().text()

      if (!raw) {
        if (validators.bodyRequired) {
          violations.push({ location: 'body', path: '', message: 'Request body is required' })
        }
      } else if (validateBody) {
        try {
          const parsed: unknown = JSON.parse(raw)
          if (!validateBody(parsed)) {
            violations.push(...mapErrors(validateBody.errors, 'body'))
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
