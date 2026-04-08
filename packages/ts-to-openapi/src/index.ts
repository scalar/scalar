import { dirname, extname, join } from 'node:path'

import type { OpenAPIV3_1 } from 'openapi-types'
import type { Identifier, ParameterDeclaration, Program, SourceFile } from 'typescript'
import {
  isArrowFunction,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isParameter,
  isPropertySignature,
  isStringLiteral,
  isTypeLiteralNode,
  isVariableStatement,
} from 'typescript'

import { getJSDocFromNode } from './js-doc'
import { generateResponses } from './responses'
import { getSchemaFromTypeNode } from './type-nodes'
import type { FileNameResolver } from './types'

export { getJSDocFromNode } from './js-doc'
export { generateResponses, getReturnStatements } from './responses'
export { getSchemaFromTypeNode } from './type-nodes'

/** Default file name resolver for import specifiers used by the TypeScript AST. */
export const defaultFileNameResolver: FileNameResolver = (sourceFileName, targetFileName) => {
  const sourceExtension = extname(sourceFileName)
  const targetExtension = extname(targetFileName)
  const targetRelativePath = targetExtension ? targetFileName : targetFileName + sourceExtension

  return join(dirname(sourceFileName), targetRelativePath)
}

/** Check if identifier is a supported HTTP method. */
export const getHttpMethodFromIdentifier = (
  identifier: Pick<Identifier, 'escapedText'> | undefined,
): OpenAPIV3_1.HttpMethods | null => {
  const method = identifier?.escapedText?.toLowerCase()

  return method?.match(/^(get|post|put|patch|delete|head|options)$/) ? (method as OpenAPIV3_1.HttpMethods) : null
}

/**
 * Takes a route handler params argument and returns path parameters.
 *
 * This follows Next.js handler shape: `({ params }: { params: { id: string } })`.
 */
export const extractPathParameters = (
  node: ParameterDeclaration | undefined,
  program: Program,
  fileNameResolver: FileNameResolver = defaultFileNameResolver,
): OpenAPIV3_1.ParameterObject[] => {
  if (
    node &&
    isParameter(node) &&
    node.type &&
    isTypeLiteralNode(node.type) &&
    node.type.members[0] &&
    isPropertySignature(node.type.members[0]) &&
    isIdentifier(node.type.members[0].name) &&
    node.type.members[0].name.escapedText === 'params' &&
    node.type.members[0].type &&
    isTypeLiteralNode(node.type.members[0].type)
  ) {
    return node.type.members[0].type.members.flatMap((member) => {
      if (!isPropertySignature(member) || !member.type) {
        return []
      }

      const name = isIdentifier(member.name)
        ? String(member.name.escapedText)
        : isStringLiteral(member.name)
          ? member.name.text
          : null

      if (!name) {
        return []
      }

      return {
        name,
        schema: getSchemaFromTypeNode(member.type, program, fileNameResolver),
        in: 'path',
        required: true,
      } as OpenAPIV3_1.ParameterObject
    })
  }

  return []
}

/**
 * Traverse a route file and extract OpenAPI path operations.
 *
 * This handles function-based handlers and variable-based handlers (`export const GET = ...`).
 */
export const getPathOperations = (
  sourceFile: SourceFile,
  program: Program,
  fileNameResolver: FileNameResolver = defaultFileNameResolver,
): OpenAPIV3_1.PathsObject => {
  const path: OpenAPIV3_1.PathsObject = {}
  const typeChecker = program.getTypeChecker()

  sourceFile.statements.forEach((statement) => {
    // Function handlers
    if (isFunctionDeclaration(statement) && statement.name) {
      const method = getHttpMethodFromIdentifier(statement.name)
      if (method) {
        const { title, description } = getJSDocFromNode(statement)
        const parameters = extractPathParameters(statement.parameters[1], program, fileNameResolver)
        const responses = generateResponses(statement.body, typeChecker)

        path[method] = {
          summary: title,
          description,
          parameters,
          responses,
        } as OpenAPIV3_1.OperationObject
      }
    }
    // Variable handlers
    else if (isVariableStatement(statement)) {
      const declaration = statement.declarationList.declarations[0]
      const method =
        declaration && isIdentifier(declaration.name) ? getHttpMethodFromIdentifier(declaration.name) : null

      if (method) {
        const { title, description } = getJSDocFromNode(statement)
        const initializer = declaration?.initializer
        const responses =
          initializer && (isArrowFunction(initializer) || isFunctionExpression(initializer))
            ? generateResponses(initializer.body, typeChecker)
            : generateResponses(statement, typeChecker)

        path[method] = {
          summary: title,
          description,
          responses,
        } as OpenAPIV3_1.OperationObject
      }
    }
  })

  return path
}
