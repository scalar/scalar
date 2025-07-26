import { generateResponses, getJSDocFromNode, getSchemaFromTypeNode } from '@scalar/ts-to-openapi'
import type { OpenAPIV3_1 } from 'openapi-types'
import { extname, join } from 'node:path'
import {
  type Identifier,
  type ParameterDeclaration,
  type Program,
  type SourceFile,
  isFunctionDeclaration,
  isIdentifier,
  isParameter,
  isPropertySignature,
  isTypeLiteralNode,
  isVariableStatement,
} from 'typescript'

/** Check if identifier is a supported http method */
const checkForMethod = (identifier: Pick<Identifier, 'escapedText'> | undefined) => {
  const method = identifier?.escapedText?.toLowerCase()

  return method?.match(/^(get|post|put|patch|delete|head|options)$/) ? (method as OpenAPIV3_1.HttpMethods) : null
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
    node.type.members[0].type &&
    isTypeLiteralNode(node.type.members[0].type)
  ) {
    return node.type.members[0].type?.members.flatMap((member) => {
      if (!isPropertySignature(member) || !member.type) {
        return []
      }

      return {
        name: member.name?.getText(),
        schema: getSchemaFromTypeNode(member.type, program, fileNameResolver),
        in: 'path',
      } as OpenAPIV3_1.ParameterObject
    })
  }

  return []
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
        const responses = generateResponses(statement.body, typeChecker)

        path[method] = {
          summary: title,
          description,
          parameters,
          responses,
        } as OpenAPIV3_1.OperationObject
      }
    }

    // TODO: variables
    else if (isVariableStatement(statement)) {
      // TODO: Remove this typecast. It looks totally incompatible
      const method = checkForMethod(statement.declarationList.declarations[0]?.name as Identifier)
      if (method) {
        const { title, description } = getJSDocFromNode(statement)
        const responses = generateResponses(statement, typeChecker)
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
