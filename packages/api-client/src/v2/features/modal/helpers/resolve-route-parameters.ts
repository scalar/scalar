import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getOperationEntries } from '@scalar/workspace-store/navigation'
import type { TraversedEntry, TraversedExample } from '@scalar/workspace-store/schemas/navigation'

/** Payload for routing and opening the API client modal. */
export type RoutePayload = {
  path: string
  method: HttpMethod
  example?: string
  documentSlug?: string
}

/** Raw input values that may contain "default" placeholders. */
export type DefaultEntities = Record<keyof RoutePayload, string>

/** Context for resolving route parameters from the workspace store. */
type ResolverContext = {
  store: WorkspaceStore
  documentSlug: string | undefined
}

/** Type guard to check if an entry is an example. */
const isExample = (entry: TraversedEntry): entry is TraversedExample => entry.type === 'example'

/**
 * Gets the document from the workspace store.
 * Returns undefined if the document slug is not provided or the document does not exist.
 */
const getDocument = (ctx: ResolverContext) => ctx.store.workspace.documents[ctx.documentSlug ?? '']

/**
 * Resolves the document slug from a raw input value.
 *
 * When "default" is specified and no document exists with that slug,
 * we fall back to the active document or the first available document.
 * This ensures a valid document is selected even when the caller does not know which documents exist.
 */
export const resolveDocumentSlug = (store: WorkspaceStore, slug: string | undefined): string | undefined => {
  const hasMatchingDocument = slug !== 'default' || store.workspace.documents[slug] !== undefined

  if (hasMatchingDocument) {
    return slug
  }

  // Fall back to active document, then first available document
  return store.workspace['x-scalar-active-document'] || Object.keys(store.workspace.documents)[0]
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
    const pathMethods = Object.keys(document.paths?.[path] ?? {})
    return pathMethods.find(isHttpMethod)
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
