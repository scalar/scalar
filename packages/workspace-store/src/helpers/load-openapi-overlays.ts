import { generateHash } from '@scalar/helpers/string/generate-hash'
import { type LoaderPlugin, resolveReferencePath } from '@scalar/json-magic/bundle'

import type { OverlayDiagnostic } from '@/helpers/compose-openapi-overlays'
import { deepClone } from '@/helpers/deep-clone'

declare const SCALAR_DISABLE_OPENAPI_OVERLAY_COMPOSITION: boolean

const loadOverlayComposer =
  typeof SCALAR_DISABLE_OPENAPI_OVERLAY_COMPOSITION !== 'undefined' && SCALAR_DISABLE_OPENAPI_OVERLAY_COMPOSITION
    ? undefined
    : () => import('./compose-openapi-overlays')

/** An explicitly supplied Overlay source. Paths use the workspace's configured file loader. */
export type OverlaySource =
  | { url: string }
  | { path: string }
  | { document: Record<string, unknown>; documentSource?: string }

/** A loader result with the final retrieval URI where the transport exposes it. */
export type DocumentLoadResult = Awaited<ReturnType<LoaderPlugin['exec']>> & { retrievalUri?: string }

/** Snapshots inline composition inputs before the next source has a chance to await. */
export const loadInlineDocument = (
  document: Record<string, unknown>,
  snapshot: boolean,
): Promise<DocumentLoadResult> => {
  const data = snapshot ? deepClone(document) : document
  return Promise.resolve({ ok: true, data, raw: JSON.stringify(data) })
}

/** Retains redirect metadata while delegating JSON/YAML parsing to the existing URL loader. */
export const loadUrlWithRetrievalUri = async (
  url: string,
  createLoader: (fetch: typeof globalThis.fetch) => LoaderPlugin,
  fetch: typeof globalThis.fetch,
): Promise<DocumentLoadResult> => {
  let retrievalUri: string | undefined
  const result = await createLoader(async (input, init) => {
    const response = await fetch(input, init)
    if (response.redirected && response.url) {
      retrievalUri = response.url
    }
    return response
  }).exec(url)
  return result.ok && retrievalUri ? { ...result, retrievalUri } : result
}

const COMPOSED_HASH_PREFIX = 'overlay:'

/** The existing snapshot hash carries the composition marker so hydration needs no Overlay sources. */
export const isComposedDocumentHash = (hash: string | undefined): boolean =>
  typeof hash === 'string' && hash.startsWith(COMPOSED_HASH_PREFIX)

/** Converts a source supported by the file loader to a URI for Overlay identity checks. */
export const getOverlayFileUri = (filePath: string): string => {
  if (/^file:/i.test(filePath)) {
    return new URL(filePath).href
  }
  const absolutePath = resolveReferencePath('./', filePath)
  const encoded = absolutePath.split('/').map(encodeURIComponent).join('/')
  if (absolutePath.startsWith('//')) {
    return new URL(`file:${encoded}`).href
  }
  const pathname = encoded.replace(/^([a-z])%3A\//i, '$1:/')
  return new URL(`file://${pathname.startsWith('/') ? '' : '/'}${pathname}`).href
}

/** Uses the caller's existing loaders for explicitly listed sources before running the pure engine. */
export const loadOpenApiOverlays = async (
  base: { data: Record<string, unknown>; raw: string; sourceUri?: string },
  overlays: readonly OverlaySource[],
  load: (source: OverlaySource) => Promise<DocumentLoadResult>,
  getSourceUri: (source: OverlaySource) => string | undefined,
): Promise<{ document: Record<string, unknown>; documentHash: string; diagnostics: OverlayDiagnostic[] }> => {
  if (!loadOverlayComposer) {
    throw new Error(
      'This build requires precomposed OpenAPI descriptions. Apply Overlays with @scalar/workspace-store.',
    )
  }

  const loadedOverlays = []
  for (const [index, source] of overlays.entries()) {
    const result = await load(source)
    const sourceUri = result.retrievalUri ?? getSourceUri(source)
    if (!result.ok) {
      throw new Error(`Failed to load Overlay ${index + 1}${sourceUri ? ` (${sourceUri})` : ''}`)
    }
    loadedOverlays.push({ document: result.data, sourceUri, raw: result.raw })
  }

  const { composeOpenApiOverlays } = await loadOverlayComposer()
  const { document, diagnostics } = composeOpenApiOverlays(base.data, loadedOverlays, base.sourceUri)
  for (const { overlayIndex, actionIndex, target } of diagnostics) {
    console.warn(`Overlay ${overlayIndex + 1}, action ${actionIndex + 1}: JSONPath "${target}" matched no nodes`)
  }

  const inputs = [[base.sourceUri, base.raw], ...loadedOverlays.map(({ sourceUri, raw }) => [sourceUri, raw])]
  // The shared hash consumes bytes. Encode Unicode before hashing so all code units affect the result.
  const documentHash = COMPOSED_HASH_PREFIX + generateHash(encodeURIComponent(JSON.stringify(inputs)))
  return { document, documentHash, diagnostics }
}
