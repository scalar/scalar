import type { OpenAPIV2, OpenAPIV3 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { traverse } from '@/helpers/traverse'

type XExampleExtensions = {
  xExample: Record<string, unknown> | undefined
  xExamples: Record<string, unknown> | undefined
}

/** Extracts and removes x-example and x-examples extensions from an object */
function extractXExampleExtensions(obj: Record<string, unknown>): XExampleExtensions {
  const xExample = obj['x-example'] as Record<string, unknown> | undefined
  const xExamples = obj['x-examples'] as Record<string, unknown> | undefined

  delete obj['x-example']
  delete obj['x-examples']

  return { xExample, xExamples }
}

/** Checks if a value is a non-null, non-array object with at least one entry */
function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0
}

/**
 * Checks if a value looks like a collection of named examples (all values are objects).
 * This helps distinguish between:
 * - A single example: { message: 'OK', type: 'success' } - values are primitives
 * - Named examples: { 'my-example': { message: 'OK' } } - values are objects
 */
function isNamedExamplesCollection(value: unknown): value is Record<string, Record<string, unknown>> {
  return (
    isNonEmptyObject(value) &&
    Object.values(value).every((v) => typeof v === 'object' && v !== null && !Array.isArray(v))
  )
}

/** The allowed properties for an OpenAPI 3.x ExampleObject */
const EXAMPLE_OBJECT_PROPERTIES = new Set(['summary', 'description', 'value', 'externalValue'])

/**
 * Checks if a value is a valid OpenAPI 3.x ExampleObject.
 *
 * An ExampleObject must have a `value` (or `externalValue`) property and can only contain
 * properties from the allowed set: `summary`, `description`, `value`, `externalValue`.
 *
 * This prevents false positives when user's example data happens to have a `value` property
 * (e.g., `{ value: "some data", count: 5 }` should NOT be treated as an ExampleObject).
 */
function isExampleObject(value: unknown): value is OpenAPIV3.ExampleObject {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>
  const hasValueOrExternalValue = 'value' in obj || 'externalValue' in obj
  const onlyHasAllowedProperties = Object.keys(obj).every((key) => EXAMPLE_OBJECT_PROPERTIES.has(key))

  return hasValueOrExternalValue && onlyHasAllowedProperties
}

/** Wraps a value as an ExampleObject, preserving existing structure if valid */
function wrapAsExampleObject(value: unknown): OpenAPIV3.ExampleObject {
  if (isExampleObject(value)) {
    return value
  }
  return { value }
}

/** Transforms x-example entries to OpenAPI 3.x examples format */
function transformXExampleToExamples(xExample: Record<string, unknown>): Record<string, OpenAPIV3.ExampleObject> {
  return Object.entries(xExample).reduce(
    (acc, [key, value]) => {
      acc[key] = { value }
      return acc
    },
    {} as Record<string, OpenAPIV3.ExampleObject>,
  )
}

/** Update the flow names to OpenAPI 3.1.0 format */
const upgradeFlow = (flow: string): 'implicit' | 'password' | 'clientCredentials' | 'authorizationCode' => {
  switch (flow) {
    case 'application':
      return 'clientCredentials'
    case 'accessCode':
      return 'authorizationCode'
    case 'implicit':
      return 'implicit'
    case 'password':
      return 'password'
    default:
      return flow as never
  }
}

/**
 * Upgrade Swagger 2.0 to OpenAPI 3.0
 *
 * https://swagger.io/blog/news/whats-new-in-openapi-3-0/
 */
export function upgradeFromTwoToThree(originalSpecification: UnknownObject) {
  let document = originalSpecification

  // Version
  if (
    document !== null &&
    typeof document === 'object' &&
    typeof document.swagger === 'string' &&
    document.swagger?.startsWith('2.0')
  ) {
    document.openapi = '3.0.4'
    delete document.swagger
  } else {
    // Skip if it's something else than 3.0.x
    return document
  }

  // Servers
  if (document.host) {
    const schemes = Array.isArray(document.schemes) && document.schemes?.length ? document.schemes : ['http']

    document.servers = schemes.map((scheme: string[]) => ({
      url: `${scheme}://${document.host}${document.basePath ?? ''}`,
    }))

    delete document.basePath
    delete document.schemes
    delete document.host
  } else if (document.basePath) {
    document.servers = [{ url: document.basePath }]
    delete document.basePath
  }

  // Schemas
  if (document.definitions) {
    document.components = Object.assign({}, document.components, {
      schemas: document.definitions,
    })

    delete document.definitions

    // Rewrite $refs to definitions
    document = traverse(document, (schema) => {
      // Rewrite $refs to components
      if (typeof schema.$ref === 'string' && schema.$ref.startsWith('#/definitions/')) {
        schema.$ref = schema.$ref.replace(/^#\/definitions\//, '#/components/schemas/')
      }

      return schema
    })
  }

  // Transform file type to string with binary format
  document = traverse(document, (schema) => {
    if (schema.type === 'file') {
      schema.type = 'string'
      schema.format = 'binary'
    }

    return schema
  })

  if (Object.hasOwn(document, 'parameters')) {
    // update all the $refs before we do any transformations
    document = traverse(document, (schema) => {
      if (typeof schema.$ref === 'string' && schema.$ref.startsWith('#/parameters/')) {
        const schemaName = schema.$ref.split('/')[2]

        if (!schemaName) {
          return schema
        }

        const param =
          document.parameters && typeof document.parameters === 'object' && schemaName in document.parameters
            ? (document.parameters as Record<string, unknown>)[schemaName]
            : undefined

        if (param && typeof param === 'object' && 'in' in param && (param.in === 'body' || param.in === 'formData')) {
          schema.$ref = schema.$ref.replace(/^#\/parameters\//, '#/components/requestBodies/')
        } else {
          schema.$ref = schema.$ref.replace(/^#\/parameters\//, '#/components/parameters/')
        }
      }

      return schema
    })

    document.components ??= {}

    const params: Record<string, OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject> = {}
    const bodyParams: Record<string, OpenAPIV3.RequestBodyObject> = {}
    const parameters =
      document.parameters && typeof document.parameters === 'object'
        ? (document.parameters as Record<string, unknown>)
        : {}
    for (const [name, param] of Object.entries(parameters)) {
      if (param && typeof param === 'object') {
        // Handle reference objects
        if ('$ref' in param) {
          const convertedParam = transformParameterObject(param as OpenAPIV2.ReferenceObject)
          params[name] = convertedParam
        } else if ('in' in param) {
          if (param.in === 'body') {
            bodyParams[name] = migrateBodyParameter(
              param as OpenAPIV2.ParameterObject,
              (document.consumes as string[] | undefined) ?? ['application/json'],
            )
          } else if (param.in === 'formData') {
            bodyParams[name] = migrateFormDataParameter(
              [param as OpenAPIV2.ParameterObject],
              document.consumes as string[] | undefined,
            )
          } else {
            const convertedParam = transformParameterObject(param as OpenAPIV2.ParameterObject)
            params[name] = convertedParam
          }
        }
      }
    }

    if (Object.keys(params).length > 0) {
      ;(document.components as UnknownObject).parameters = params
    }

    if (Object.keys(bodyParams).length > 0) {
      ;(document.components as UnknownObject).requestBodies = bodyParams
    }

    delete document.parameters
  }

  // Handle global responses defined in #/responses
  if (Object.hasOwn(document, 'responses') && typeof document.responses === 'object' && document.responses !== null) {
    // Update all $refs from #/responses/ to #/components/responses/
    document = traverse(document, (schema) => {
      if (typeof schema.$ref === 'string' && schema.$ref.startsWith('#/responses/')) {
        schema.$ref = schema.$ref.replace(/^#\/responses\//, '#/components/responses/')
      }
      return schema
    })

    document.components ??= {}

    const migratedResponses: Record<string, OpenAPIV3.ResponseObject | OpenAPIV3.ReferenceObject> = {}
    const responses = document.responses as Record<string, unknown>

    for (const [name, response] of Object.entries(responses)) {
      if (response && typeof response === 'object') {
        // Handle reference objects
        if ('$ref' in response) {
          migratedResponses[name] = response as OpenAPIV3.ReferenceObject
        } else {
          // Transform the response object
          const responseObj = response as Record<string, unknown>
          const produces = (document.produces as string[] | undefined) ?? ['application/json']

          // Transform schema to content
          if (responseObj.schema) {
            if (typeof responseObj.content !== 'object') {
              responseObj.content = {}
            }

            for (const type of produces) {
              ;(responseObj.content as Record<string, unknown>)[type] = {
                schema: responseObj.schema,
              }
            }

            delete responseObj.schema
          }

          // Transform examples from Swagger 2.0 to OpenAPI 3.0 format
          if (responseObj.examples && typeof responseObj.examples === 'object') {
            if (typeof responseObj.content !== 'object') {
              responseObj.content = {}
            }

            for (const [mediaType, exampleValue] of Object.entries(responseObj.examples as Record<string, unknown>)) {
              if (typeof (responseObj.content as Record<string, unknown>)[mediaType] !== 'object') {
                ;(responseObj.content as Record<string, unknown>)[mediaType] = {}
              }
              ;((responseObj.content as Record<string, unknown>)[mediaType] as Record<string, unknown>).example =
                exampleValue
            }

            delete responseObj.examples
          }

          // Transform headers if present
          if (responseObj.headers && typeof responseObj.headers === 'object') {
            responseObj.headers = Object.entries(responseObj.headers as Record<string, unknown>).reduce(
              (acc, [headerName, header]) => {
                if (header && typeof header === 'object') {
                  return {
                    [headerName]: transformResponseHeader(header as OpenAPIV2.HeaderObject),
                    ...acc,
                  }
                }
                return acc
              },
              {} as Record<string, OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject>,
            )
          }

          migratedResponses[name] = responseObj as OpenAPIV3.ResponseObject
        }
      }
    }

    if (Object.keys(migratedResponses).length > 0) {
      ;(document.components as UnknownObject).responses = migratedResponses
    }

    delete document.responses
  }

  // Paths
  if (typeof document.paths === 'object') {
    for (const path in document.paths) {
      if (Object.hasOwn(document.paths, path)) {
        const pathItem =
          document.paths && typeof document.paths === 'object' && path in document.paths
            ? (document.paths as Record<string, unknown>)[path]
            : undefined

        if (!pathItem || typeof pathItem !== 'object') {
          continue
        }

        let requestBodyObject: OpenAPIV3.RequestBodyObject | undefined

        for (const methodOrParameters in pathItem) {
          if (methodOrParameters === 'parameters' && Object.hasOwn(pathItem, methodOrParameters)) {
            const pathItemParameters = migrateParameters(
              (pathItem as any).parameters,
              (document.consumes as string[] | undefined) ?? ['application/json'],
            )

            ;(pathItem as any).parameters = pathItemParameters.parameters
            requestBodyObject = pathItemParameters.requestBody
          } else if (Object.hasOwn(pathItem, methodOrParameters)) {
            const operationItem = (pathItem as any)[methodOrParameters]

            if (requestBodyObject) {
              operationItem.requestBody = requestBodyObject
            }

            if (operationItem.parameters) {
              const migrationResult = migrateParameters(
                operationItem.parameters,
                operationItem.consumes ?? document.consumes ?? ['application/json'],
              )

              operationItem.parameters = migrationResult.parameters

              if (migrationResult.requestBody) {
                operationItem.requestBody = migrationResult.requestBody
              }
            }

            delete operationItem.consumes

            // Responses
            if (operationItem.responses) {
              for (const response in operationItem.responses) {
                if (Object.hasOwn(operationItem.responses, response)) {
                  const responseItem = operationItem.responses[response]

                  if (responseItem.headers && typeof responseItem.headers === 'object') {
                    responseItem.headers = Object.entries(responseItem.headers).reduce(
                      (acc, [name, header]) => {
                        if (header && typeof header === 'object') {
                          return {
                            [name]: transformResponseHeader(header as OpenAPIV2.HeaderObject),
                            ...acc,
                          }
                        }
                        return acc
                      },
                      {} as Record<string, OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject>,
                    )
                  }
                  if (responseItem.schema) {
                    const produces = document.produces ?? operationItem.produces ?? ['application/json']

                    if (typeof responseItem.content !== 'object') {
                      responseItem.content = {}
                    }

                    for (const type of produces) {
                      responseItem.content[type] = {
                        schema: responseItem.schema,
                      }
                    }

                    delete responseItem.schema
                  }

                  // Transform response examples from Swagger 2.0 to OpenAPI 3.0 format
                  // In Swagger 2.0, examples are at response level: examples: { 'application/json': {...} }
                  // In OpenAPI 3.0, examples move inside content: content: { 'application/json': { example: {...} } }
                  if (responseItem.examples && typeof responseItem.examples === 'object') {
                    if (typeof responseItem.content !== 'object') {
                      responseItem.content = {}
                    }

                    for (const [mediaType, exampleValue] of Object.entries(responseItem.examples)) {
                      if (typeof responseItem.content[mediaType] !== 'object') {
                        responseItem.content[mediaType] = {}
                      }
                      responseItem.content[mediaType].example = exampleValue
                    }

                    delete responseItem.examples
                  }
                }
              }
            }

            delete operationItem.produces

            // Delete empty parameters
            if (operationItem.parameters?.length === 0) {
              delete operationItem.parameters
            }
          }
        }
      }
    }
  }

  // Upgrade securityDefinitions
  if (document.securityDefinitions) {
    if (typeof document.components !== 'object' || document.components === null) {
      document.components = {}
    }

    if (document.components && typeof document.components === 'object') {
      Object.assign(document.components, { securitySchemes: {} })
    }

    for (const [key, securityScheme] of Object.entries(document.securityDefinitions)) {
      if (typeof securityScheme === 'object') {
        if ('type' in securityScheme && securityScheme.type === 'oauth2') {
          const { flow, authorizationUrl, tokenUrl, scopes } = securityScheme as {
            type: 'oauth2'
            flow?: string
            authorizationUrl?: string
            tokenUrl?: string
            scopes?: Record<string, string>
          }

          // Convert flow values to OpenAPI 3.1.0 format

          if (
            document.components &&
            typeof document.components === 'object' &&
            'securitySchemes' in document.components &&
            document.components.securitySchemes
          ) {
            Object.assign(document.components.securitySchemes, {
              [key]: {
                type: 'oauth2',
                flows: {
                  [upgradeFlow(flow || 'implicit')]: Object.assign(
                    {},
                    authorizationUrl && { authorizationUrl },
                    tokenUrl && { tokenUrl },
                    scopes && { scopes },
                  ),
                },
              },
            })
          }
        } else if ('type' in securityScheme && securityScheme.type === 'basic') {
          if (
            document.components &&
            typeof document.components === 'object' &&
            'securitySchemes' in document.components &&
            document.components.securitySchemes
          ) {
            Object.assign(document.components.securitySchemes, {
              [key]: {
                type: 'http',
                scheme: 'basic',
              },
            })
          }
        } else {
          if (
            document.components &&
            typeof document.components === 'object' &&
            'securitySchemes' in document.components &&
            document.components.securitySchemes
          ) {
            Object.assign(document.components.securitySchemes, {
              [key]: securityScheme,
            })
          }
        }
      }
    }

    delete document.securityDefinitions
  }

  delete document.consumes
  delete document.produces

  return document as OpenAPIV3.Document
}

function transformItemsObject<T extends Record<PropertyKey, unknown>>(obj: T): OpenAPIV3.SchemaObject {
  const schemaProperties = [
    'type',
    'format',
    'items',
    'maximum',
    'exclusiveMaximum',
    'minimum',
    'exclusiveMinimum',
    'maxLength',
    'minLength',
    'pattern',
    'maxItems',
    'minItems',
    'uniqueItems',
    'enum',
    'multipleOf',
  ]

  return schemaProperties.reduce((acc, property) => {
    if (Object.hasOwn(obj, property)) {
      acc[property] = obj[property]
      delete obj[property]
    }

    return acc
  }, {} as OpenAPIV3.SchemaObject)
}

function getParameterLocation(location: OpenAPIV2.ParameterLocation): OpenAPIV3.ParameterLocation {
  if (location === 'formData') {
    throw new Error('Encountered a formData parameter which should have been filtered out by the caller')
  }
  if (location === 'body') {
    throw new Error('Encountered a body parameter which should have been filtered out by the caller')
  }
  return location as OpenAPIV3.ParameterLocation
}

function transformParameterObject(
  parameter: OpenAPIV2.ParameterObject | OpenAPIV2.ReferenceObject,
): OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject {
  if (Object.hasOwn(parameter, '$ref') && '$ref' in parameter) {
    return {
      $ref: parameter.$ref,
    }
  }

  // it is important to call getParameterSerializationStyle first because transformItemsObject modifies properties on which getParameterSerializationStyle rely on
  const serializationStyle = getParameterSerializationStyle(parameter)
  const schema = transformItemsObject(parameter)

  const { xExample, xExamples } = extractXExampleExtensions(parameter as Record<string, unknown>)

  // Input:
  // x-example:
  //   application/json:
  //     message: OK
  //     type: success
  //   text/plain: 'OK'

  // Output:
  // examples:
  //   application/json:
  //     value:
  //       message: OK
  //       type: success
  //   text/plain:
  //     value: 'OK'

  // We need to transform the x-example to an examples object and add "value" to the structure
  if (isNonEmptyObject(xExample)) {
    parameter.examples = transformXExampleToExamples(xExample)
  } else if (isNonEmptyObject(xExamples)) {
    parameter.examples = Object.entries(xExamples).reduce(
      (acc, [key, exampleValue]) => {
        acc[key] = wrapAsExampleObject(exampleValue)
        return acc
      },
      {} as Record<string, OpenAPIV3.ExampleObject>,
    )
  }

  delete parameter.collectionFormat
  delete parameter.default

  if (!parameter.in) {
    throw new Error('Parameter object must have an "in" property')
  }

  return {
    schema,
    ...serializationStyle,
    ...parameter,
    in: getParameterLocation(parameter.in),
  }
}

/**
 * Transform OpenAPI 2.0 response header to OpenAPI 3.0 format.
 * Response headers do not have "in", "name", "style", or "explode" properties.
 */
function transformResponseHeader(
  header: OpenAPIV2.HeaderObject | OpenAPIV2.ReferenceObject,
): OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject {
  if (Object.hasOwn(header, '$ref') && '$ref' in header) {
    return {
      $ref: header.$ref,
    }
  }

  const schema = transformItemsObject(header)

  return {
    ...header,
    schema,
  }
}

type CollectionFormat = 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi'

type ParameterSerializationStyle = { style?: OpenAPIV3.ParameterStyle; explode?: boolean }

const querySerialization: Record<CollectionFormat, ParameterSerializationStyle> = {
  ssv: {
    style: 'spaceDelimited',
    explode: false,
  },
  pipes: {
    style: 'pipeDelimited',
    explode: false,
  },
  multi: {
    style: 'form',
    explode: true,
  },
  csv: {
    style: 'form',
    explode: false,
  },
  tsv: {},
}

const pathAndHeaderSerialization: Record<CollectionFormat, ParameterSerializationStyle> = {
  ssv: {},
  pipes: {},
  multi: {},
  csv: {
    style: 'simple',
    explode: false,
  },
  tsv: {},
}

const serializationStyles = {
  header: pathAndHeaderSerialization,
  query: querySerialization,
  path: pathAndHeaderSerialization,
} as const

function getParameterSerializationStyle(parameter: OpenAPIV2.ParameterObject): ParameterSerializationStyle {
  if (
    parameter.type !== 'array' ||
    !(parameter.in === 'query' || parameter.in === 'path' || parameter.in === 'header')
  ) {
    return {}
  }

  const collectionFormat = parameter.collectionFormat ?? 'csv'

  if (
    parameter.in in serializationStyles &&
    collectionFormat in serializationStyles[parameter.in as keyof typeof serializationStyles]
  ) {
    return serializationStyles[parameter.in as keyof typeof serializationStyles][collectionFormat as CollectionFormat]
  }

  return {}
}

type ParameterMigrationResult = {
  parameters: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[]
  requestBody?: OpenAPIV3.RequestBodyObject
}

function migrateBodyParameter(
  bodyParameter: OpenAPIV2.ParameterObject,
  consumes: string[],
): OpenAPIV3.RequestBodyObject {
  // Extract x-example and x-examples before deleting other properties
  // @see https://redocly.com/docs-legacy/api-reference-docs/specification-extensions/x-examples
  const { xExample, xExamples } = extractXExampleExtensions(bodyParameter as Record<string, unknown>)

  delete bodyParameter.name
  delete bodyParameter.in

  const { schema, ...requestBody } = bodyParameter

  const requestBodyObject: OpenAPIV3.RequestBodyObject = {
    content: {},
    ...requestBody,
  }

  if (requestBodyObject.content) {
    for (const type of consumes) {
      requestBodyObject.content[type] = {
        schema: schema,
      }

      // Handle x-example (singular) - Redocly extension for Swagger 2.0
      // Transforms to OpenAPI 3.x `example` field
      if (isNonEmptyObject(xExample) && type in xExample) {
        requestBodyObject.content[type].example = xExample[type]
      }

      // Handle x-examples (plural) - Redocly extension for Swagger 2.0
      // Transforms to OpenAPI 3.x `examples` field (named examples with summary/value)
      if (isNonEmptyObject(xExamples) && type in xExamples) {
        const examples = xExamples[type]

        // Check if examples is already in proper OpenAPI 3.x format (object with entries that are valid ExampleObjects)
        const isExamplesCollection =
          isNonEmptyObject(examples) && Object.values(examples).every((example) => isExampleObject(example))

        if (isExamplesCollection) {
          requestBodyObject.content[type].examples = examples as Record<string, OpenAPIV3.ExampleObject>
        }
        // Named examples without value wrappers - wrap each individually
        else if (isNamedExamplesCollection(examples)) {
          requestBodyObject.content[type].examples = Object.entries(examples).reduce(
            (acc, [key, exampleValue]) => {
              acc[key] = wrapAsExampleObject(exampleValue)
              return acc
            },
            {} as Record<string, OpenAPIV3.ExampleObject>,
          )
        }
        // Single example value - wrap as default
        else {
          requestBodyObject.content[type].examples = {
            default: wrapAsExampleObject(examples),
          }
        }
      }
    }
  }

  return requestBodyObject
}

function migrateFormDataParameter(
  parameters: OpenAPIV2.ParameterObject[],
  consumes: string[] | undefined = ['multipart/form-data'],
): OpenAPIV3.RequestBodyObject {
  const requestBodyObject: OpenAPIV3.RequestBodyObject = {
    content: {},
  }

  // Ensure consumes contains a form data content type
  const filtered = consumes.filter(
    (type) => type === 'multipart/form-data' || type === 'application/x-www-form-urlencoded',
  )
  const contentTypes = filtered.length > 0 ? filtered : ['multipart/form-data']

  if (requestBodyObject.content) {
    for (const contentType of contentTypes) {
      requestBodyObject.content[contentType] = {
        schema: {
          type: 'object',
          properties: {},
          required: [], // Initialize required array
        },
      }

      const formContent = requestBodyObject.content?.[contentType]
      if (formContent?.schema && typeof formContent.schema === 'object' && 'properties' in formContent.schema) {
        for (const param of parameters) {
          if (param.name && formContent.schema.properties) {
            formContent.schema.properties[param.name] = {
              type: param.type,
              description: param.description,
              ...(param.format ? { format: param.format } : {}),
            }

            // Add to required array if param is required
            if (param.required && Array.isArray(formContent.schema.required)) {
              formContent.schema.required.push(param.name)
            }
          }
        }
      }
    }
  }

  return requestBodyObject
}

function migrateParameters(parameters: OpenAPIV2.ParameterObject[], consumes: string[]): ParameterMigrationResult {
  const result: ParameterMigrationResult = {
    parameters: parameters
      .filter((parameter) => !(parameter.in === 'body' || parameter.in === 'formData'))
      .map((parameter) => transformParameterObject(parameter)),
  }

  const bodyParameter = structuredClone(
    parameters.find((parameter: OpenAPIV2.ParameterObject) => parameter.in === 'body') ?? {},
  )

  if (bodyParameter && Object.keys(bodyParameter).length) {
    result.requestBody = migrateBodyParameter(bodyParameter, consumes)
  }

  const formDataParameters = parameters.filter((parameter: OpenAPIV2.ParameterObject) => parameter.in === 'formData')

  if (formDataParameters.length > 0) {
    const requestBodyObject = migrateFormDataParameter(formDataParameters, consumes)

    if (typeof result.requestBody !== 'object') {
      result.requestBody = requestBodyObject
    } else {
      result.requestBody = {
        ...result.requestBody,
        content: {
          ...result.requestBody.content,
          ...requestBodyObject.content,
        },
      }
    }

    if (typeof result.requestBody !== 'object') {
      result.requestBody = {
        content: {},
      }
    }
  }

  return result
}
