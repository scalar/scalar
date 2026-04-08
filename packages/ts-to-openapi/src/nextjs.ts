import { existsSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'

import type { OpenAPIV3_1 } from 'openapi-types'
import {
  type Identifier,
  type Node,
  type ParameterDeclaration,
  type Program,
  type SourceFile,
  isArrowFunction,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isVariableStatement,
} from 'typescript'

import { getJSDocFromNode } from './js-doc'
import { collectTypeScriptFiles, createProgramFromFileSystem } from './program'
import { generateResponses } from './responses'
import { getSchemaFromTypeNode } from './type-nodes'
import type { FileNameResolver } from './types'

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const

const isHttpMethod = (value: string): value is OpenAPIV3_1.HttpMethods =>
  (HTTP_METHODS as readonly string[]).includes(value)

const DEFAULT_INFO_DESCRIPTION = 'Generated from Next.js route handlers'

const normalizePath = (value: string): string => value.replaceAll('\\', '/')

const isRouteHandlerFile = (fileName: string): boolean => /\/route\.tsx?$/.test(normalizePath(fileName))

const resolveImportFileName: FileNameResolver = (sourceFileName: string, targetFileName: string): string => {
  const sourceDirectory = dirname(sourceFileName)
  const targetPath = join(sourceDirectory, targetFileName)

  if (extname(targetFileName)) {
    return targetPath
  }

  const candidates = [`${targetPath}.ts`, `${targetPath}.tsx`, `${targetPath}.d.ts`]
  const fileName = candidates.find((candidate) => existsSync(candidate))

  return fileName ?? `${targetPath}.ts`
}

const getHttpMethod = (identifier: Pick<Identifier, 'escapedText'> | undefined): OpenAPIV3_1.HttpMethods | null => {
  const method = identifier?.escapedText?.toString().toLowerCase()
  return method && isHttpMethod(method) ? method : null
}

const isSchemaObject = (
  schema: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject | undefined,
): schema is OpenAPIV3_1.SchemaObject => schema !== undefined && typeof schema === 'object' && !('$ref' in schema)

const getFunctionBody = (node: Node | undefined): Node | undefined => {
  if (!node) {
    return undefined
  }

  if (isArrowFunction(node) || isFunctionExpression(node)) {
    return node.body
  }

  return undefined
}

const getFunctionContextParameter = (node: Node | undefined): ParameterDeclaration | undefined => {
  if (!node) {
    return undefined
  }

  if (isArrowFunction(node) || isFunctionExpression(node)) {
    return node.parameters[1]
  }

  return undefined
}

const getPathParameters = (node: ParameterDeclaration | undefined, program: Program): OpenAPIV3_1.ParameterObject[] => {
  if (!node?.type) {
    return []
  }

  const contextSchema = getSchemaFromTypeNode(node.type, program, resolveImportFileName)
  const contextProperties =
    contextSchema.type === 'object' && contextSchema.properties
      ? (contextSchema.properties as Record<string, OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject>)
      : undefined
  const paramsSchema = contextProperties?.params

  if (!isSchemaObject(paramsSchema) || paramsSchema.type !== 'object' || !paramsSchema.properties) {
    return []
  }

  return Object.entries(paramsSchema.properties).flatMap(([name, schema]) => {
    if (!isSchemaObject(schema)) {
      return []
    }

    return {
      in: 'path',
      name,
      required: true,
      schema,
    } as OpenAPIV3_1.ParameterObject
  })
}

const toOpenApiSegment = (segment: string): string | null => {
  if (/^\(.+\)$/.test(segment)) {
    return null
  }

  const optionalCatchAll = segment.match(/^\[\[\.\.\.([^\]]+)\]\]$/)
  if (optionalCatchAll?.[1]) {
    return `{${optionalCatchAll[1]}}`
  }

  const catchAll = segment.match(/^\[\.\.\.([^\]]+)\]$/)
  if (catchAll?.[1]) {
    return `{${catchAll[1]}}`
  }

  const dynamicSegment = segment.match(/^\[([^\]]+)\]$/)
  if (dynamicSegment?.[1]) {
    return `{${dynamicSegment[1]}}`
  }

  return segment
}

const createOperationObject = (
  docsNode: Node,
  bodyNode: Node | undefined,
  parameters: OpenAPIV3_1.ParameterObject[],
  program: Program,
): OpenAPIV3_1.OperationObject => {
  const { title, description } = getJSDocFromNode(docsNode)
  const responses = generateResponses(bodyNode, program.getTypeChecker())
  const operation: OpenAPIV3_1.OperationObject = {
    responses: Object.keys(responses).length
      ? responses
      : {
          default: {
            description: 'No response body detected',
          },
        },
  }

  if (title) {
    operation.summary = title
  }
  if (description) {
    operation.description = description
  }
  if (parameters.length) {
    operation.parameters = parameters
  }

  return operation
}

/**
 * Converts a Next.js route file path into an OpenAPI path.
 */
export const getOpenApiPathFromNextJsRouteFile = (routeFileName: string, apiDirectory: string): string => {
  const routeDirectory = dirname(resolve(routeFileName))
  const apiRoot = resolve(apiDirectory)
  const relativeDirectory = normalizePath(relative(apiRoot, routeDirectory))
  const segments = relativeDirectory
    .split('/')
    .filter(Boolean)
    .map(toOpenApiSegment)
    .filter((segment): segment is string => Boolean(segment))

  return segments.length ? `/${segments.join('/')}` : '/'
}

/**
 * Builds a path item object from a Next.js route source file.
 */
export const getPathItemFromNextJsSourceFile = (
  sourceFile: SourceFile,
  program: Program,
): OpenAPIV3_1.PathItemObject => {
  const pathItem: Record<string, OpenAPIV3_1.OperationObject> = {}

  sourceFile.statements.forEach((statement) => {
    if (isFunctionDeclaration(statement) && statement.name) {
      const method = getHttpMethod(statement.name)
      if (!method) {
        return
      }

      pathItem[method] = createOperationObject(
        statement,
        statement.body,
        getPathParameters(statement.parameters[1], program),
        program,
      )
      return
    }

    if (isVariableStatement(statement)) {
      statement.declarationList.declarations.forEach((declaration) => {
        if (!isIdentifier(declaration.name)) {
          return
        }

        const method = getHttpMethod(declaration.name)
        if (!method) {
          return
        }

        const bodyNode = getFunctionBody(declaration.initializer)
        const contextParameter = getFunctionContextParameter(declaration.initializer)
        pathItem[method] = createOperationObject(
          statement,
          bodyNode,
          getPathParameters(contextParameter, program),
          program,
        )
      })
    }
  })

  return pathItem as OpenAPIV3_1.PathItemObject
}

type GenerateNextJsOpenApiDocumentOptions = {
  /** Root directory used to resolve `apiDirectory`. Defaults to `process.cwd()`. */
  cwd?: string
  /** App Router API directory containing route handlers. Defaults to `app/api`. */
  apiDirectory?: string
  /** OpenAPI info object values. */
  info?: Partial<OpenAPIV3_1.InfoObject>
  /** Optional server definitions for the generated document. */
  servers?: OpenAPIV3_1.ServerObject[]
}

/**
 * Generates an OpenAPI 3.1 document from Next.js route handlers.
 */
export const generateNextJsOpenApiDocument = (
  options: GenerateNextJsOpenApiDocumentOptions = {},
): OpenAPIV3_1.Document => {
  const cwd = resolve(options.cwd ?? process.cwd())
  const apiDirectory = resolve(cwd, options.apiDirectory ?? 'app/api')
  const allFiles = collectTypeScriptFiles(apiDirectory)
  const routeFiles = allFiles.filter(isRouteHandlerFile)
  const program = createProgramFromFileSystem({ rootDirectory: apiDirectory })
  const infoOptions = options.info ?? {}
  const info: OpenAPIV3_1.InfoObject = {
    title: infoOptions.title ?? process.env.npm_package_name ?? 'Next.js API',
    version: infoOptions.version ?? process.env.npm_package_version ?? '0.0.0',
    description: infoOptions.description ?? DEFAULT_INFO_DESCRIPTION,
    summary: infoOptions.summary,
    termsOfService: infoOptions.termsOfService,
    contact: infoOptions.contact,
    license: infoOptions.license,
  }

  const paths = routeFiles.reduce<OpenAPIV3_1.PathsObject>((accumulator, routeFileName) => {
    const sourceFile = program.getSourceFile(routeFileName)

    if (!sourceFile) {
      return accumulator
    }

    const path = getOpenApiPathFromNextJsRouteFile(routeFileName, apiDirectory)
    const pathItem = getPathItemFromNextJsSourceFile(sourceFile, program)

    if (!Object.keys(pathItem).length) {
      return accumulator
    }

    return {
      ...accumulator,
      [path]: pathItem,
    }
  }, {})

  return {
    openapi: '3.1.0',
    info,
    paths,
    ...(options.servers ? { servers: options.servers } : {}),
  }
}
