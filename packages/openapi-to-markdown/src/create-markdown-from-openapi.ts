import { isObject } from '@scalar/helpers/object/is-object'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { normalize } from '@scalar/json-magic/helpers/normalize'
import type { OpenAPI } from '@scalar/openapi-types'
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

type AnyDocument = OpenAPI.Document | Record<string, unknown> | string
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

const INTERNAL_KEYS = new Set([
  '$ref',
  '$ref-value',
  'x-ext',
  'x-ext-urls',
  'x-scalar-navigation',
  'x-scalar-is-dirty',
  'x-original-oas-version',
  'x-scalar-original-document-hash',
  'x-scalar-original-source-url',
])

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

const dereferenceNode = (input: unknown, cache = new WeakMap<object, unknown>()): unknown => {
  if (Array.isArray(input)) {
    if (cache.has(input)) {
      return cache.get(input)
    }

    const output: unknown[] = []
    cache.set(input, output)

    input.forEach((item) => {
      output.push(dereferenceNode(item, cache))
    })

    return output
  }

  if (!isObject(input)) {
    return input
  }

  if (cache.has(input)) {
    return cache.get(input)
  }

  const output: Record<string, unknown> = {}
  cache.set(input, output)

  const source = input as Record<string, unknown>
  const resolvedReference = source['$ref-value']

  const assign = (value: Record<string, unknown>) => {
    Object.entries(value).forEach(([key, entry]) => {
      if (INTERNAL_KEYS.has(key) || key.startsWith('__scalar_')) {
        return
      }

      output[key] = dereferenceNode(entry, cache)
    })
  }

  if (isObject(resolvedReference)) {
    assign(resolvedReference as Record<string, unknown>)
  }

  assign(source)

  return output
}

const loadDocument = async (input: AnyDocument): Promise<OpenAPI.Document> => {
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

  const document = workspaceStore.workspace.documents[name]

  if (!document) {
    throw new Error('OpenAPI document could not be resolved')
  }

  return dereferenceNode(document) as OpenAPI.Document
}

export async function createHtmlFromOpenApi(input: AnyDocument) {
  const content = await loadDocument(input)

  // Create and configure a server-side rendered Vue app
  const app = createSSRApp(MarkdownReference, {
    content,
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

export async function createMarkdownFromOpenApi(content: AnyDocument) {
  return markdownFromHtml(await createHtmlFromOpenApi(content))
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
