import { isObject } from '@scalar/helpers/object/is-object'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { normalize } from '@scalar/json-magic/helpers/normalize'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { createDocumentRenderer } from './render-document'
import { type OpenApiRenderOptions, selectDocument } from './select-document'

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

/** A resolved API description that can render multiple pages without loading it again. */
export type OpenApiMarkdownRenderer = {
  render: (options?: OpenApiRenderOptions) => Promise<string>
}

/**
 * Load and resolve an API description once, then render any number of selections.
 * Each renderer owns its document; create a new renderer to pick up source changes.
 */
export const createOpenApiMarkdownRenderer = async (input: AnyDocument): Promise<OpenApiMarkdownRenderer> => {
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

  const renderDocument = createDocumentRenderer()
  return {
    render: async (options) => await renderDocument(selectDocument(content as OpenApiDocument, options)),
  }
}

/** Generate Markdown from an API description, optionally scoped to a single page. */
export const createMarkdownFromOpenApi = async (
  input: AnyDocument,
  options?: OpenApiRenderOptions,
): Promise<string> => {
  const renderer = await createOpenApiMarkdownRenderer(input)
  return renderer.render(options)
}
