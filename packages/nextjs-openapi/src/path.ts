import { extname, join } from 'node:path'

import { generateResponses, getJSDocFromNode, getSchemaFromTypeNode } from '@scalar/ts-to-openapi'
import type { OpenAPIV3_1 } from 'openapi-types'
import {
  type Identifier,
  type ParameterDeclaration,
  type Program,
  type SourceFile,
  type TypeNode,
  isArrowFunction,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isParameter,
  isPropertySignature,
  isTypeLiteralNode,
  isTypeReferenceNode,
  isVariableStatement,
} from 'typescript'

/** Check if identifier is a supported http method */
const checkForMethod = (identifier: Pick<Identifier, 'escapedText'> | undefined): OpenAPIV3_1.HttpMethods | null => {
  const method = identifier?.escapedText?.toLowerCase()

  return method?.match(/^(get|post|put|patch|delete|head|options)$/) ? (method as OpenAPIV3_1.HttpMethods) : null
}

const fileNameResolver = (source: string, target: string): string => {
  const sourceExt = extname(source)
  const targetExt = extname(target)

  const targetRelative = target + (targetExt ? '' : sourceExt)
  const targetPath = join(source.replace(/\/([^/]+)$/, ''), targetRelative)

  return targetPath
}

/** Next.js 16 requires asynchronous route params; older handlers use plain objects. */
const unwrapPromise = (typeNode: TypeNode): TypeNode | undefined => {
  if (
    isTypeReferenceNode(typeNode) &&
    isIdentifier(typeNode.typeName) &&
    typeNode.typeName.text === 'Promise' &&
    typeNode.typeArguments?.length === 1
  ) {
    return typeNode.typeArguments[0]
  }

  return typeNode
}

/**
 * Takes a parameter node and returns a path parameter schema
 */
const extractPathParams = (node: ParameterDeclaration | undefined, program: Program): OpenAPIV3_1.ParameterObject[] => {
  // Traverse to the params with type guards
  if (
    node &&
    isParameter(node) &&
    node.type &&
    isTypeLiteralNode(node.type) &&
    node.type.members[0] &&
    isPropertySignature(node.type.members[0]) &&
    isIdentifier(node.type.members[0].name) &&
    node.type.members[0].name.escapedText === 'params' &&
    node.type.members[0].type
  ) {
    const resolvedType = unwrapPromise(node.type.members[0].type)

    if (!resolvedType || !isTypeLiteralNode(resolvedType)) {
      return []
    }

    return resolvedType.members.flatMap((member) => {
      if (!isPropertySignature(member) || !member.type) {
        return []
      }

      return {
        name: member.name?.getText(),
        schema: getSchemaFromTypeNode(member.type, program, fileNameResolver),
        in: 'path',
        required: true,
      } as OpenAPIV3_1.ParameterObject
    })
  }

  return []
}

/**
 * Traverse the typescript file and extract as much info as we can for the openapi spec
 */
export const getPathSchema = (
  sourceFile: SourceFile,
  program: Program,
  routePath?: string,
): OpenAPIV3_1.PathsObject => {
  const path: OpenAPIV3_1.PathsObject = {}
  const typeChecker = program.getTypeChecker()

  sourceFile.statements.forEach((statement) => {
    // Function
    if (isFunctionDeclaration(statement) && statement.name) {
      const method = checkForMethod(statement.name)
      if (method) {
        const { title, description } = getJSDocFromNode(statement)
        const parameters = extractPathParams(statement.parameters[1], program)
        const responses = generateResponses(statement.body, typeChecker)

        path[method] = {
          summary: title,
          description,
          parameters,
          responses,
        } as OpenAPIV3_1.OperationObject
      }
    }

    // A statement can declare several route handlers alongside other variables.
    else if (isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const method = isIdentifier(declaration.name) ? checkForMethod(declaration.name) : null
        if (!method) {
          continue
        }

        const { title, description } = getJSDocFromNode(statement)
        const initializer = declaration.initializer
        const handler =
          initializer && (isArrowFunction(initializer) || isFunctionExpression(initializer)) ? initializer : undefined

        path[method] = {
          summary: title,
          description,
          ...(handler ? { parameters: extractPathParams(handler.parameters[1], program) } : {}),
          responses: generateResponses(handler, typeChecker),
        } as OpenAPIV3_1.OperationObject
      }
    }
  })

  // Named aliases and generated RouteContext types may not be available to the
  // compiler host. The route still provides the names required by OpenAPI.
  if (routePath) {
    const parameterNames = [...new Set([...routePath.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]!))]

    for (const operation of Object.values(path)) {
      if (!operation) {
        continue
      }
      const parameters = operation.parameters ?? []
      for (const name of parameterNames) {
        if (
          !parameters.some((parameter) => 'name' in parameter && parameter.in === 'path' && parameter.name === name)
        ) {
          parameters.push({ name, in: 'path', required: true, schema: { type: 'string' } })
        }
      }
      operation.parameters = parameters
    }
  }

  return path
}
