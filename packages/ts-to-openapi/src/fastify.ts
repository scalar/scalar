import type { OpenAPIV3_1 } from 'openapi-types'
import {
  type CallExpression,
  type Expression,
  type Node,
  type ObjectLiteralExpression,
  type Program,
  SyntaxKind,
  type TypeLiteralNode,
  forEachChild,
  isArrayLiteralExpression,
  isCallExpression,
  isExpressionStatement,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPrefixUnaryExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isPropertySignature,
  isShorthandPropertyAssignment,
  isSourceFile,
  isStringLiteral,
  isTypeLiteralNode,
  isVariableStatement,
} from 'typescript'

import { getSchemaFromTypeNode } from './type-nodes'
import type { FileNameResolver } from './types'

const FASTIFY_METHODS = ['delete', 'get', 'head', 'patch', 'post', 'put', 'options'] as const

type FastifyMethod = (typeof FASTIFY_METHODS)[number]

const ROUTE_INPUT_TO_PARAMETER_IN = {
  Params: 'path',
  Querystring: 'query',
  Headers: 'header',
} as const

type RouteInputName = keyof typeof ROUTE_INPUT_TO_PARAMETER_IN

type RouteGenericSchemas = Partial<Record<'Body' | 'Headers' | 'Params' | 'Querystring' | 'Reply', OpenAPIV3_1.SchemaObject>>

const isFastifyMethod = (method: string): method is FastifyMethod =>
  FASTIFY_METHODS.includes(method as FastifyMethod)

const getPropertyName = (name: Node): string | undefined => {
  if (isIdentifier(name) || isStringLiteral(name) || isNumericLiteral(name)) {
    return name.text
  }

  return undefined
}

const getObjectLiteralProperty = (objectLiteral: ObjectLiteralExpression, propertyName: string): Expression | undefined => {
  const property = objectLiteral.properties.find((item) => {
    if (isPropertyAssignment(item)) {
      return getPropertyName(item.name) === propertyName
    }

    return isShorthandPropertyAssignment(item) && item.name.text === propertyName
  })

  if (property && isPropertyAssignment(property)) {
    return property.initializer
  }

  if (property && isShorthandPropertyAssignment(property)) {
    return property.name
  }

  return undefined
}

const getStringValue = (expression: Expression | undefined): string | undefined => {
  if (!expression) {
    return undefined
  }

  if (isStringLiteral(expression) || isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text
  }

  return undefined
}

const toOpenApiPath = (url: string): string => url.replaceAll(/:([A-Za-z0-9_]+)/g, '{$1}')

const getLiteralValue = (expression: Expression): unknown => {
  if (isStringLiteral(expression) || isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text
  }

  if (isNumericLiteral(expression)) {
    return Number(expression.text)
  }

  if (expression.kind === SyntaxKind.TrueKeyword) {
    return true
  }

  if (expression.kind === SyntaxKind.FalseKeyword) {
    return false
  }

  if (expression.kind === SyntaxKind.NullKeyword) {
    return null
  }

  if (isPrefixUnaryExpression(expression) && isNumericLiteral(expression.operand)) {
    return expression.operator === SyntaxKind.MinusToken ? -Number(expression.operand.text) : Number(expression.operand.text)
  }

  if (isArrayLiteralExpression(expression)) {
    return expression.elements.map((element) => getLiteralValue(element))
  }

  return undefined
}

const getJsonSchemaFromObjectLiteral = (objectLiteral: ObjectLiteralExpression): OpenAPIV3_1.SchemaObject => {
  return objectLiteral.properties.reduce<OpenAPIV3_1.SchemaObject>((schema, property) => {
    if (!isPropertyAssignment(property)) {
      return schema
    }

    const propertyName = getPropertyName(property.name)

    if (!propertyName) {
      return schema
    }

    if (propertyName === 'properties' && isObjectLiteralExpression(property.initializer)) {
      return {
        ...schema,
        properties: property.initializer.properties.reduce<NonNullable<OpenAPIV3_1.SchemaObject['properties']>>(
          (properties, schemaProperty) => {
            if (!isPropertyAssignment(schemaProperty)) {
              return properties
            }

            const schemaPropertyName = getPropertyName(schemaProperty.name)

            return schemaPropertyName
              ? {
                  ...properties,
                  [schemaPropertyName]: isObjectLiteralExpression(schemaProperty.initializer)
                    ? getJsonSchemaFromObjectLiteral(schemaProperty.initializer)
                    : {},
                }
              : properties
          },
          {},
        ),
      }
    }

    if (isObjectLiteralExpression(property.initializer)) {
      return {
        ...schema,
        [propertyName]: getJsonSchemaFromObjectLiteral(property.initializer),
      }
    }

    return {
      ...schema,
      [propertyName]: getLiteralValue(property.initializer),
    }
  }, {})
}

const getSchemaProperty = (
  schemaNode: Expression | undefined,
  propertyName: string,
): OpenAPIV3_1.SchemaObject | undefined => {
  if (!schemaNode || !isObjectLiteralExpression(schemaNode)) {
    return undefined
  }

  const property = getObjectLiteralProperty(schemaNode, propertyName)

  return property && isObjectLiteralExpression(property) ? getJsonSchemaFromObjectLiteral(property) : undefined
}

const getRouteGenericSchemas = (
  typeLiteral: TypeLiteralNode | undefined,
  program: Program,
  fileNameResolver: FileNameResolver,
): RouteGenericSchemas => {
  if (!typeLiteral) {
    return {}
  }

  return typeLiteral.members.reduce<RouteGenericSchemas>((schemas, member) => {
    if (isPropertySignature(member) && member.type && isIdentifier(member.name)) {
      const name = member.name.text

      if (name === 'Body' || name === 'Headers' || name === 'Params' || name === 'Querystring' || name === 'Reply') {
        return {
          ...schemas,
          [name]: getSchemaFromTypeNode(member.type, program, fileNameResolver),
        }
      }
    }

    return schemas
  }, {})
}

const getFastifyRouteCall = (node: Node): CallExpression | undefined => {
  if (isExpressionStatement(node) && isCallExpression(node.expression)) {
    return node.expression
  }

  if (isVariableStatement(node)) {
    for (const declaration of node.declarationList.declarations) {
      if (declaration.initializer && isCallExpression(declaration.initializer)) {
        return declaration.initializer
      }
    }
  }

  return undefined
}

const getFastifyRouteCalls = (node: Node): CallExpression[] => {
  const calls: CallExpression[] = []

  const visit = (currentNode: Node): void => {
    const callExpression = getFastifyRouteCall(currentNode)

    if (callExpression && getRouteMetadata(callExpression)) {
      calls.push(callExpression)
      return
    }

    forEachChild(currentNode, visit)
  }

  visit(node)

  return calls
}

const getRouteMetadata = (
  callExpression: CallExpression,
): { method: FastifyMethod; url: string; options: ObjectLiteralExpression | undefined } | undefined => {
  const expression = callExpression.expression

  if (isPropertyAccessExpression(expression)) {
    const methodName = expression.name.text

    if (isFastifyMethod(methodName)) {
      const [urlExpression, optionsExpression] = callExpression.arguments
      const url = getStringValue(urlExpression)

      if (!url) {
        return undefined
      }

      return {
        method: methodName,
        url,
        options: optionsExpression && isObjectLiteralExpression(optionsExpression) ? optionsExpression : undefined,
      }
    }

    if (methodName === 'route') {
      const [routeOptions] = callExpression.arguments

      if (!routeOptions || !isObjectLiteralExpression(routeOptions)) {
        return undefined
      }

      const method = getStringValue(getObjectLiteralProperty(routeOptions, 'method'))?.toLowerCase()
      const url = getStringValue(getObjectLiteralProperty(routeOptions, 'url'))

      if (!method || !isFastifyMethod(method) || !url) {
        return undefined
      }

      return {
        method,
        url,
        options: routeOptions,
      }
    }
  }

  return undefined
}

const getRouteTypeLiteral = (callExpression: CallExpression): TypeLiteralNode | undefined => {
  const [typeArgument] = callExpression.typeArguments ?? []

  return typeArgument && isTypeLiteralNode(typeArgument) ? typeArgument : undefined
}

const getParameters = (
  routeGenericSchemas: RouteGenericSchemas,
  schemaNode: Expression | undefined,
): OpenAPIV3_1.ParameterObject[] => {
  return (Object.keys(ROUTE_INPUT_TO_PARAMETER_IN) as RouteInputName[]).flatMap((inputName) => {
    const schema = getSchemaProperty(schemaNode, inputName.toLowerCase()) ?? routeGenericSchemas[inputName]

    if (!schema || !schema.properties) {
      return []
    }

    const required = Array.isArray(schema.required) ? schema.required.map(String) : []

    return Object.entries(schema.properties).map(
      ([name, propertySchema]) =>
        ({
          in: ROUTE_INPUT_TO_PARAMETER_IN[inputName],
          name,
          required: inputName === 'Params' || required.includes(name),
          schema: propertySchema,
        }) as OpenAPIV3_1.ParameterObject,
    )
  })
}

const getRequestBody = (
  routeGenericSchemas: RouteGenericSchemas,
  schemaNode: Expression | undefined,
): OpenAPIV3_1.RequestBodyObject | undefined => {
  const schema = getSchemaProperty(schemaNode, 'body') ?? routeGenericSchemas.Body

  if (!schema) {
    return undefined
  }

  return {
    required: true,
    content: {
      'application/json': {
        schema,
      },
    },
  }
}

const getResponses = (
  routeGenericSchemas: RouteGenericSchemas,
  schemaNode: Expression | undefined,
): OpenAPIV3_1.ResponsesObject => {
  const responseSchema = getSchemaProperty(schemaNode, 'response')

  if (responseSchema) {
    return Object.entries(responseSchema).reduce<OpenAPIV3_1.ResponsesObject>((responses, [status, schema]) => {
      const responseBodySchema = schema as OpenAPIV3_1.SchemaObject
      const { description, ...contentSchema } = responseBodySchema
      const hasContentSchema = Object.keys(contentSchema).length > 0

      return {
        ...responses,
        [status]: {
          description: typeof description === 'string' ? description : 'Successful response',
          ...(hasContentSchema
            ? {
                content: {
                  'application/json': {
                    schema: contentSchema,
                  },
                },
              }
            : {}),
        },
      }
    }, {})
  }

  if (routeGenericSchemas.Reply?.properties) {
    return Object.entries(routeGenericSchemas.Reply.properties).reduce<OpenAPIV3_1.ResponsesObject>(
      (responses, [status, schema]) => ({
        ...responses,
        [status]: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: schema as OpenAPIV3_1.SchemaObject,
            },
          },
        },
      }),
      {},
    )
  }

  return {
    200: {
      description: 'Successful response',
    },
  }
}

/**
 * Generate OpenAPI paths from Fastify route declarations.
 */
export const getFastifyRoutes = (
  node: Node | undefined,
  program: Program,
  fileNameResolver: FileNameResolver,
): OpenAPIV3_1.PathsObject => {
  if (!node) {
    return {}
  }

  const sourceFile = isSourceFile(node) ? node : node.getSourceFile()
  return getFastifyRouteCalls(sourceFile).reduce<OpenAPIV3_1.PathsObject>((paths, callExpression) => {
    const routeMetadata = getRouteMetadata(callExpression)

    if (!routeMetadata) {
      return paths
    }

    const routeGenericSchemas = getRouteGenericSchemas(getRouteTypeLiteral(callExpression), program, fileNameResolver)
    const schemaNode = routeMetadata.options ? getObjectLiteralProperty(routeMetadata.options, 'schema') : undefined
    const path = toOpenApiPath(routeMetadata.url)
    const operation: OpenAPIV3_1.OperationObject = {
      ...(schemaNode && isObjectLiteralExpression(schemaNode) && getStringValue(getObjectLiteralProperty(schemaNode, 'description'))
        ? { description: getStringValue(getObjectLiteralProperty(schemaNode, 'description')) }
        : {}),
      ...(schemaNode && isObjectLiteralExpression(schemaNode) && getStringValue(getObjectLiteralProperty(schemaNode, 'summary'))
        ? { summary: getStringValue(getObjectLiteralProperty(schemaNode, 'summary')) }
        : {}),
      parameters: getParameters(routeGenericSchemas, schemaNode),
      responses: getResponses(routeGenericSchemas, schemaNode),
      ...(getRequestBody(routeGenericSchemas, schemaNode)
        ? { requestBody: getRequestBody(routeGenericSchemas, schemaNode) }
        : {}),
    }

    return {
      ...paths,
      [path]: {
        ...paths[path],
        [routeMetadata.method]: operation,
      },
    }
  }, {})
}

/**
 * Generate a minimal OpenAPI document from Fastify route declarations.
 */
export const generateFastifyOpenApiDocument = (
  node: Node | undefined,
  program: Program,
  fileNameResolver: FileNameResolver,
  info: OpenAPIV3_1.InfoObject = {
    title: 'Fastify API',
    version: '0.0.0',
  },
): OpenAPIV3_1.Document => ({
  openapi: '3.1.0',
  info,
  paths: getFastifyRoutes(node, program, fileNameResolver),
})
