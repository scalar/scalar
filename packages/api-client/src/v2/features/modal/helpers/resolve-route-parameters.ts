import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedPathItem } from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import { getOperationEntries } from '@scalar/workspace-store/navigation'
import type { TraversedEntry, TraversedExample } from '@scalar/workspace-store/schemas/navigation'
import { isAsyncApiDocument, isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'

/** Payload for routing and opening the API client modal. */
export type RoutePayload = {
  /** OpenAPI path. Optional because AsyncAPI documents route by channel instead. */
  path?: string
  /** OpenAPI method. Optional because AsyncAPI documents route by channel instead. */
  method?: HttpMethod
  example?: string
  documentSlug?: string
  /** AsyncAPI channel key. AsyncAPI documents route by channel instead of path/method. */
  channel?: string
}

/**
 * Raw input values that may contain "default" placeholders.
 *
 * `channel` is optional: OpenAPI callers never set it, and AsyncAPI callers that omit it fall back
 * to the document's first channel.
 */
export type DefaultEntities = Record<keyof Omit<RoutePayload, 'channel'>, string> & { channel?: string }

/** Context for resolving route parameters from the workspace store. */
type ResolverContext = {
  store: WorkspaceStore
  documentSlug: string | undefined
}

/** Type guard to check if an entry is an example. */
const isExample = (entry: TraversedEntry): entry is TraversedExample => entry.type === 'example'

/**
 * Gets the OpenAPI document from the workspace store.
 * Returns undefined if the document slug is not provided or the document is not OpenAPI.
 * Path/method/example resolution is OpenAPI-only — AsyncAPI docs surface as undefined here.
 */
const getDocument = (ctx: ResolverContext) => {
  const doc = ctx.store.workspace.documents[ctx.documentSlug ?? '']
  return isOpenApiDocument(doc) ? doc : undefined
}

/**
 * Gets the AsyncAPI document from the workspace store.
 * Returns undefined if the document slug is not provided or the document is not AsyncAPI.
 */
const getAsyncApiDocument = (ctx: ResolverContext): AsyncApiDocument | undefined => {
  const doc = ctx.store.workspace.documents[ctx.documentSlug ?? '']
  return isAsyncApiDocument(doc) ? doc : undefined
}

/**
 * Resolves the AsyncAPI channel key from a raw input value.
 *
 * When "default" is specified (or the requested channel does not exist), returns the first
 * channel in the document. AsyncAPI documents connect one channel at a time.
 */
export const resolveChannel = (document: AsyncApiDocument, channel: string | undefined): string | undefined => {
  const channelKeys = Object.keys(document.channels ?? {})

  if (!channel || channel === 'default') {
    return channelKeys[0]
  }

  return channelKeys.includes(channel) ? channel : channelKeys[0]
}

/**
 * Resolves the document slug from a raw input value.
 *
 * When "default" is specified and no document exists with that slug,
 * we fall back to the active document or the first available document.
 * The modal renders both OpenAPI operations and AsyncAPI channels, so the
 * fallback accepts either — preferring the active document, then the first
 * OpenAPI document, and finally the first AsyncAPI document.
 */
export const resolveDocumentSlug = (store: WorkspaceStore, slug: string | undefined): string | undefined => {
  const hasMatchingDocument = slug !== 'default' || store.workspace.documents[slug] !== undefined

  if (hasMatchingDocument) {
    return slug
  }

  // Prefer the active document when it is one the modal can render.
  const activeSlug = store.workspace['x-scalar-active-document']
  const activeDocument = activeSlug ? store.workspace.documents[activeSlug] : undefined
  if (activeSlug && (isOpenApiDocument(activeDocument) || isAsyncApiDocument(activeDocument))) {
    return activeSlug
  }

  // Otherwise pick the first OpenAPI document, then fall back to the first AsyncAPI document.
  const entries = Object.entries(store.workspace.documents)
  return (
    entries.find(([, document]) => isOpenApiDocument(document))?.[0] ??
    entries.find(([, document]) => isAsyncApiDocument(document))?.[0]
  )
}

/**
 * Resolves the path from a raw input value.
 *
 * When "default" is specified, returns the first available path in the document.
 * This is useful for initial navigation when no specific path is requested.
 */
export const resolvePath = (ctx: ResolverContext, path: string | undefined): string | undefined => {
  const document = getDocument(ctx)

  if (!document) {
    return undefined
  }

  if (path === 'default') {
    return Object.keys(document.paths ?? {})[0]
  }

  return path
}

/**
 * Resolves the HTTP method from a raw input value.
 *
 * When "default" is specified, returns the first valid HTTP method for the given path.
 * This ensures we select a real method rather than metadata keys like "parameters" or "summary".
 */
export const resolveMethod = (
  ctx: ResolverContext,
  path: string | undefined,
  method: string | undefined,
): HttpMethod | undefined => {
  const document = getDocument(ctx)

  if (!document || !path) {
    return undefined
  }

  if (method === 'default') {
    const pathItem = getResolvedPathItem(document.paths?.[path])
    if (!pathItem) {
      return undefined
    }
    const pathMethods = Object.keys(pathItem).filter(isHttpMethod)
    return pathMethods[0]
  }

  return isHttpMethod(method) ? method : undefined
}

/**
 * Resolves the example name from a raw input value.
 *
 * When "default" is specified, returns the first available example name.
 * Falls back to "default" when no examples exist, which signals to use the default request body.
 */
export const resolveExampleName = (
  ctx: ResolverContext,
  operation: TraversedEntry | undefined,
  exampleKey: string | undefined,
): string => {
  const document = getDocument(ctx)

  if (!document || operation?.type !== 'operation') {
    return 'default'
  }

  const examples = operation.children?.filter(isExample) ?? []
  const matchingExample = examples.find((child) => child.name === exampleKey)

  if (matchingExample) {
    return matchingExample.name
  }

  if (exampleKey === 'default') {
    return examples[0]?.name ?? 'default'
  }

  return 'default'
}

/**
 * Resolves all route parameters from raw input values to their actual values.
 *
 * This function handles "default" placeholders by looking up actual values from the workspace store.
 * It ensures the modal can be opened even when the caller does not know specific paths, methods, or examples.
 */
export const resolveRouteParameters = (store: WorkspaceStore, params: DefaultEntities): Partial<RoutePayload> => {
  const documentSlug = resolveDocumentSlug(store, params.documentSlug)
  const ctx: ResolverContext = { store, documentSlug }

  // AsyncAPI documents route by channel and have no path/method/example.
  const asyncApiDocument = getAsyncApiDocument(ctx)
  if (asyncApiDocument) {
    return { documentSlug, channel: resolveChannel(asyncApiDocument, params.channel) }
  }

  const path = resolvePath(ctx, params.path)
  const method = resolveMethod(ctx, path, params.method)

  const traversedDocument = getDocument(ctx)?.['x-scalar-navigation']

  if (!traversedDocument) {
    return { documentSlug, path, method, example: 'default' }
  }

  const operations = getOperationEntries(traversedDocument)
  const operation = operations.get(`${path}|${method}`)?.find((entry) => entry.type === 'operation')
  const example = resolveExampleName(ctx, operation, params.example)

  return { documentSlug, path, method, example }
}
