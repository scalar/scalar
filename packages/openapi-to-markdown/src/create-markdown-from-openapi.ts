import { isObject } from '@scalar/helpers/object/is-object'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { normalize } from '@scalar/json-magic/helpers/normalize'
import type {
  OpenApiDocument,
  PathItemObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { minify } from 'html-minifier-terser'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

import MarkdownReference from './components/MarkdownReference.vue'

type AnyDocument = OpenApiDocument | Record<string, unknown> | string
type HttpMethodKeys = Exclude<
  keyof PathItemObject,
  '$ref' | 'summary' | 'description' | 'servers' | 'parameters'
>
export type HttpMethod = Extract<HttpMethodKeys, string>
export type OperationSelector =
  | {
      path: string
      method: HttpMethod | Uppercase<HttpMethod>
    }
  | {
      operationId: string
    }
export type OpenApiRenderOptions = {
  operation?: OperationSelector
}
type WorkspaceInput =
  | {
      document: Record<string, unknown>
    }
  | {
      url: string
    }
  | {
      path: string
    }
type OperationMatch = {
  path: string
  method: HttpMethod
}

const HTTP_METHODS: HttpMethod[] = [
  'get',
  'put',
  'post',
  'delete',
  'connect',
  'options',
  'head',
  'patch',
  'trace',
]
const HTTP_METHOD_SET = new Set<string>(HTTP_METHODS)

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const toWorkspaceInput = (input: AnyDocument): WorkspaceInput => {
  if (typeof input !== 'string') {
    return { document: input as Record<string, unknown> }
  }

  const normalized = normalize(input)

  if (isObject(normalized)) {
    return { document: normalized as Record<string, unknown> }
  }

  if (isHttpUrl(input)) {
    return { url: input }
  }

  return { path: input }
}

const normalizeHttpMethod = (method: string): HttpMethod | null => {
  const normalized = method.toLowerCase()

  if (HTTP_METHOD_SET.has(normalized)) {
    return normalized as HttpMethod
  }

  return null
}

const getPathEntries = (document: OpenApiDocument): Array<[string, PathItemObject]> => {
  const paths = document.paths

  if (!isObject(paths)) {
    return []
  }

  return Object.entries(paths).flatMap(([path, pathItem]) =>
    isObject(pathItem) ? [[path, pathItem as PathItemObject]] : [],
  )
}

const filterPathItemToSingleOperation = (
  pathItem: PathItemObject,
  selectedMethod: HttpMethod,
): PathItemObject =>
  Object.fromEntries(
    Object.entries(pathItem).filter(([key]) => {
      const method = normalizeHttpMethod(key)
      return !method || method === selectedMethod
    }),
  )

const findOperationByPathAndMethod = (
  document: OpenApiDocument,
  selector: Extract<OperationSelector, { path: string }>,
): OperationMatch => {
  const method = normalizeHttpMethod(selector.method)

  if (!method) {
    throw new Error(
      `Invalid HTTP method "${selector.method}". Supported methods: ${HTTP_METHODS.join(', ')}`,
    )
  }

  const pathEntries = getPathEntries(document)
  const pathItem = pathEntries.find(([path]) => path === selector.path)?.[1]

  if (!pathItem || !(method in pathItem)) {
    throw new Error(
      `Operation not found for path "${selector.path}" and method "${method.toUpperCase()}"`,
    )
  }

  return {
    path: selector.path,
    method,
  }
}

const findOperationsByOperationId = (
  document: OpenApiDocument,
  operationId: string,
): OperationMatch[] =>
  getPathEntries(document).flatMap(([path, pathItem]) =>
    Object.entries(pathItem).flatMap(([methodKey, operation]) => {
      const method = normalizeHttpMethod(methodKey)

      if (!method || !isObject(operation)) {
        return []
      }

      const candidateOperationId =
        'operationId' in operation && typeof operation.operationId === 'string'
          ? operation.operationId
          : undefined

      if (candidateOperationId !== operationId) {
        return []
      }

      return [{ path, method }]
    }),
  )

const resolveOperationMatch = (
  document: OpenApiDocument,
  selector: OperationSelector,
): OperationMatch => {
  if ('operationId' in selector) {
    const matches = findOperationsByOperationId(document, selector.operationId)

    if (!matches.length) {
      throw new Error(`Operation with operationId "${selector.operationId}" was not found`)
    }

    if (matches.length > 1) {
      const uniqueCandidates = matches.map(
        ({ path, method }) => `"${method.toUpperCase()} ${path}"`,
      )

      throw new Error(
        `Multiple operations found for operationId "${selector.operationId}". Use { path, method } instead. Matches: ${uniqueCandidates.join(', ')}`,
      )
    }

    return matches[0] as OperationMatch
  }

  return findOperationByPathAndMethod(document, selector)
}

const filterDocumentByOperation = (
  document: OpenApiDocument,
  selector: OperationSelector,
): OpenApiDocument => {
  const match = resolveOperationMatch(document, selector)
  const pathItem = getPathEntries(document).find(([path]) => path === match.path)?.[1]

  if (!pathItem) {
    throw new Error(
      `Operation not found for path "${match.path}" and method "${match.method.toUpperCase()}"`,
    )
  }

  return {
    ...document,
    paths: {
      [match.path]: filterPathItemToSingleOperation(pathItem, match.method),
    },
  }
}

export async function createHtmlFromOpenApi(
  input: AnyDocument,
  options?: OpenApiRenderOptions,
) {
  const workspaceStore = createWorkspaceStore({
    fileLoader: readFiles(),
  })

  const name = 'openapi-to-markdown'
  const loaded = await workspaceStore.addDocument({
    name,
    ...toWorkspaceInput(input),
  })

  if (!loaded) {
    throw new Error('Failed to load OpenAPI document')
  }

  const content = workspaceStore.workspace.documents[name]

  if (!content) {
    throw new Error('OpenAPI document could not be resolved')
  }

  const renderedContent =
    options?.operation && isObject(content)
      ? filterDocumentByOperation(content as OpenApiDocument, options.operation)
      : content

  // Create and configure a server-side rendered Vue app
  const app = createSSRApp(MarkdownReference, {
    content: renderedContent,
  })

  // Get static HTML
  const html = await renderToString(app)

  // Clean the output
  return minify(html, {
    removeComments: true,
    removeEmptyElements: true,
    collapseWhitespace: true,
    continueOnParseError: true,
    noNewlinesBeforeTagClose: true,
    preserveLineBreaks: true,
    removeEmptyAttributes: true,
    decodeEntities: true,
    useShortDoctype: true,
  })
}

export async function createMarkdownFromOpenApi(
  content: AnyDocument,
  options?: OpenApiRenderOptions,
) {
  return markdownFromHtml(await createHtmlFromOpenApi(content, options))
}

async function markdownFromHtml(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(remarkGfm)
    .use(rehypeSanitize)
    .use(rehypeRemark)
    .use(remarkStringify, {
      bullet: '-',
    })
    .process(html)

  return String(file)
}
