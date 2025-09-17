import type { OpenAPIV2, OpenAPIV3 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { traverse } from '@/helpers/traverse'

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

    const params: Record<string, OpenAPIV3.ParameterObject> = {}
    const bodyParams: Record<string, OpenAPIV3.RequestBodyObject> = {}
    const parameters =
      document.parameters && typeof document.parameters === 'object'
        ? (document.parameters as Record<string, unknown>)
        : {}
    for (const [name, param] of Object.entries(parameters)) {
      if (param && typeof param === 'object' && 'in' in param) {
        if (param.in === 'body') {
          bodyParams[name] = migrateBodyParameter(
            param as OpenAPIV2.ParameterObject,
            (document.consumes as string[] | undefined) ?? ['application/json'],
          )
        } else if (param.in === 'formData') {
          bodyParams[name] = migrateFormDataParameter([param as OpenAPIV2.ParameterObject])
        } else {
          params[name] = transformParameterObject(param as OpenAPIV2.ParameterObject)
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
                            [name]: transformParameterObject(header as OpenAPIV2.ParameterObject),
                            ...acc,
                          }
                        }
                        return acc
                      },
                      {} as Record<string, OpenAPIV3.ParameterObject>,
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

function transformParameterObject(parameter: OpenAPIV2.ParameterObject): OpenAPIV3.ParameterObject {
  if (Object.hasOwn(parameter, '$ref')) {
    return parameter
  }

  // it is important to call getParameterSerializationStyle first because transformItemsObject modifies properties on which getParameterSerializationStyle rely on
  const serializationStyle = getParameterSerializationStyle(parameter)
  const schema = transformItemsObject(parameter)

  delete parameter.collectionFormat
  delete parameter.default

  return {
    schema,
    ...serializationStyle,
    ...parameter,
  }
}

type CollectionFormat = 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi'

type ParameterSerializationStyle = { style?: string; explode?: boolean }

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
  parameters: OpenAPIV3.ParameterObject[]
  requestBody?: OpenAPIV3.RequestBodyObject
}

function migrateBodyParameter(
  bodyParameter: OpenAPIV2.ParameterObject,
  consumes: string[],
): OpenAPIV3.RequestBodyObject {
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
    }
  }

  return requestBodyObject
}

function migrateFormDataParameter(parameters: OpenAPIV2.ParameterObject[]): OpenAPIV3.RequestBodyObject {
  const requestBodyObject: OpenAPIV3.RequestBodyObject = {
    content: {},
  }

  if (requestBodyObject.content) {
    requestBodyObject.content['application/x-www-form-urlencoded'] = {
      schema: {
        type: 'object',
        properties: {},
        required: [], // Initialize required array
      },
    }

    const formContent = requestBodyObject.content?.['application/x-www-form-urlencoded']
    if (formContent?.schema && typeof formContent.schema === 'object' && 'properties' in formContent.schema) {
      for (const param of parameters) {
        if (param.name && formContent.schema.properties) {
          formContent.schema.properties[param.name] = {
            type: param.type,
            description: param.description,
          }

          // Add to required array if param is required
          if (param.required && Array.isArray(formContent.schema.required)) {
            formContent.schema.required.push(param.name)
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
    parameters.find((parameter: OpenAPIV3.ParameterObject) => parameter.in === 'body') ?? {},
  )

  if (bodyParameter && Object.keys(bodyParameter).length) {
    result.requestBody = migrateBodyParameter(bodyParameter, consumes)
  }

  const formDataParameters = parameters.filter((parameter: OpenAPIV2.ParameterObject) => parameter.in === 'formData')

  if (formDataParameters.length > 0) {
    const requestBodyObject = migrateFormDataParameter(formDataParameters)

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
