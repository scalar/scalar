import {
  generateResponses,
  getJSDocFromNode,
  getSchemaFromTypeNode,
} from '@scalar/ts-to-openapi'
import type { OpenAPIV3_1 } from 'openapi-types'
import { extname, join } from 'path'
import {
  type Identifier,
  NodeArray,
  type ParameterDeclaration,
  type Program,
  type SourceFile,
  SyntaxKind,
  isFunctionDeclaration,
  isIdentifier,
  isParameter,
  isPropertySignature,
  isTypeLiteralNode,
  isVariableStatement,
} from 'typescript'

/** Check if identifier is a supported http method */
const checkForMethod = (identifier: Identifier): string | null => {
  const method = identifier?.escapedText?.toLowerCase()

  return method?.match(/^(get|post|put|patch|delete|head|options)$/)
    ? method
    : null
}

const fileNameResolver = (source: string, target: string) => {
  const sourceExt = extname(source)
  const targetExt = extname(target)

  const targetRelative = target + (targetExt ? '' : sourceExt)
  const targetPath = join(source.replace(/\/([^/]+)$/, ''), targetRelative)

  return targetPath
}

/**
 * Takes a parameter node and returns a path parameter schema
 */
const extractPathParams = (
  node: ParameterDeclaration,
  program: Program,
): OpenAPIV3_1.ParameterObject[] => {
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
    node.type.members[0].type &&
    isTypeLiteralNode(node.type.members[0].type)
  )
    return node.type.members[0].type?.members.flatMap((member) => {
      if (!isPropertySignature(member) || !member.type) return []

      return {
        name: member.name?.getText(),
        schema: getSchemaFromTypeNode(member.type, program, fileNameResolver),
        in: 'path',
      }
    })
}

/**
 * Traverse the typescript file and extract as much info as we can for the openapi spec
 */
export const getPathSchema = (sourceFile: SourceFile, program: Program) => {
  const path: OpenAPIV3_1.PathsObject = {}
  const typeChecker = program.getTypeChecker()

  sourceFile.statements.forEach((statement) => {
    // Function
    if (isFunctionDeclaration(statement) && statement.name) {
      const method = checkForMethod(statement.name)
      if (method) {
        const { title, description } = getJSDocFromNode(statement)
        const parameters = extractPathParams(statement.parameters[1], program)

        // Extract responses
        const responses = statement.body
          ? generateResponses(statement.body, typeChecker)
          : {}

        path[method] = { summary: title, description, parameters, responses }
      }
    }

    // TODO: variables
    else if (isVariableStatement(statement)) {
      const method = checkForMethod(
        statement.declarationList.declarations[0].name as Identifier,
      )
      if (method) {
        const { title, description } = getJSDocFromNode(statement)
        const responses = generateResponses(statement, typeChecker)
        path[method] = { summary: title, description, responses }
      }
    }
  })

  return path
}
