import { isObject } from '@scalar/helpers/object/is-object'
import { generateHash } from '@scalar/helpers/string/generate-hash'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { hasDocumentChanges } from '@/helpers/has-document-changes'
import type { NormalizedConfiguration } from '@/helpers/normalize-configurations'

/**
 * Apply a title-only source edit without rebuilding the imported document.
 * Uncertain changes keep using the normal import path, including external references
 * whose contents may have changed independently of the inline source.
 */
export const updateDocumentTitle = (
  updated: NormalizedConfiguration,
  previous: NormalizedConfiguration | undefined,
  store: WorkspaceStore,
  clientStore: WorkspaceStore,
): boolean => {
  const content = updated.source.content
  const oldContent = previous?.source.content
  if (
    !content ||
    !oldContent ||
    updated.slug !== previous?.slug ||
    !isObject(content.info) ||
    !isObject(oldContent.info) ||
    !Object.prototype.propertyIsEnumerable.call(content.info, 'title') ||
    'toJSON' in content ||
    'toJSON' in content.info ||
    typeof content.info.title !== 'string' ||
    typeof oldContent.info.title !== 'string' ||
    content.info.title === oldContent.info.title ||
    typeof content.openapi !== 'string' ||
    !/^3\.[01]\./.test(content.openapi) ||
    hasDocumentChanges(updated.config, previous.config)
  ) {
    return false
  }

  const { info, ...rest } = content
  const { info: oldInfo, ...oldRest } = oldContent
  const { title, ...infoRest } = info
  const { title: _oldTitle, ...oldInfoRest } = oldInfo
  if (typeof title !== 'string' || hasDocumentChanges(rest, oldRest) || hasDocumentChanges(infoRest, oldInfoRest)) {
    return false
  }

  const document = store.workspace.documents[updated.slug]
  const clientDocument = clientStore.workspace.documents[updated.slug]
  const original = store.getOriginalDocument(updated.slug)
  const intermediate = store.getIntermediateDocument(updated.slug)
  if (
    !document?.info ||
    !clientDocument?.info ||
    !original ||
    !intermediate ||
    !isObject(original.info) ||
    !isObject(intermediate.info) ||
    document.info.title !== oldContent.info.title ||
    original.info.title !== oldContent.info.title ||
    intermediate.info.title !== oldContent.info.title ||
    // Supplied navigation and chunked documents may contain precomputed title-dependent data.
    'x-scalar-navigation' in content ||
    'x-scalar-chunk-index' in content
  ) {
    return false
  }

  // Serialization is also required by a full import to compute the original document hash.
  // Reuse it to reject references into metadata: bundling may have copied their targets.
  let raw: string
  try {
    raw = JSON.stringify(content)
    for (const match of raw.matchAll(/"\$(?:dynamicRef|ref)"\s*:\s*("(?:[^"\\]|\\.)*")/g)) {
      const reference: unknown = JSON.parse(match[1] ?? 'null')
      if (typeof reference !== 'string' || !reference.startsWith('#') || reference === '#') {
        return false
      }
      const pointer = decodeURIComponent(reference.slice(1))
      // A named anchor outside info cannot contain the changed title. Reject anchors on
      // the root or within info, where resolving them could copy title-dependent data.
      if (
        (!pointer.startsWith('/') &&
          ('$anchor' in content ||
            '$dynamicAnchor' in content ||
            /"\$(?:dynamicAnchor|anchor)"\s*:/.test(JSON.stringify(info)))) ||
        pointer === '/info' ||
        pointer.startsWith('/info/')
      ) {
        return false
      }
    }
  } catch {
    return false
  }

  // Replace only the small info objects in the isolated baselines. Other snapshot subtrees
  // retain their existing ownership; the caller's source is never inserted into the store.
  store.loadWorkspace({
    documents: {},
    originalDocuments: { [updated.slug]: { ...original, info: { ...original.info, title } } },
    intermediateDocuments: { [updated.slug]: { ...intermediate, info: { ...intermediate.info, title } } },
    overrides: {},
    meta: {},
    history: {},
    auth: {},
  })

  const hash = generateHash(raw)
  for (const target of [document, clientDocument]) {
    target.info = { ...target.info, title }
    target['x-scalar-original-document-hash'] = hash
    const navigation = target['x-scalar-navigation']
    if (navigation) {
      navigation.title = title.trim() || 'Untitled Document'
    }
  }
  return true
}
