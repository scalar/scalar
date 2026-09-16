import { isObject } from '@scalar/helpers/object/is-object'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { normalize } from '@scalar/json-magic/helpers/normalize'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { minify } from 'html-minifier-terser'

import { markdownFromHtml, renderDocument } from './render-document'
import type { OpenApiRenderOptions } from './select-document'

type AnyDocument = OpenApiDocument | Record<string, unknown> | string
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

export async function createHtmlFromOpenApi(input: AnyDocument, options?: OpenApiRenderOptions) {
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

  const html = await renderDocument(content as OpenApiDocument, options)

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

export async function createMarkdownFromOpenApi(content: AnyDocument, options?: OpenApiRenderOptions) {
  return markdownFromHtml(await createHtmlFromOpenApi(content, options))
}
