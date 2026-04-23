import { isObject } from '@scalar/helpers/object/is-object'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { parse as parseYaml } from 'yaml'

import { generateUniqueSlug } from '@/v2/features/command-palette/helpers/generate-unique-slug'

/** Raw result returned by a registry fetcher implementation. */
export type FetchRegistryDocumentResult =
  | {
      message: string
      error: true
    }
  | {
      data: string
      error: false
    }

/**
 * Fetcher contract for retrieving a document from a registry.
 *
 * The returned `data` is expected to be the raw document contents (JSON or
 * YAML) which will be parsed by the hook before being added to the workspace.
 */
export type FetchRegistryDocument = (params: {
  namespace: string
  slug: string
  version?: string
}) => Promise<FetchRegistryDocumentResult>

/** Result of attempting to load a registry document into the workspace store. */
export type LoadRegistryDocumentResult = { ok: true; documentName: string } | { ok: false; error: string }

/**
 * Parses raw registry document contents as JSON and falls back to YAML.
 * Returns `null` when the value cannot be parsed into an object, so callers
 * can surface a clear error instead of storing malformed data.
 */
const parseRegistryDocument = (raw: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(raw)
    if (isObject(parsed)) {
      return parsed
    }
  } catch {
    // Intentionally ignored: fall through to YAML parsing.
  }

  try {
    const parsed = parseYaml(raw)
    if (isObject(parsed)) {
      return parsed
    }
  } catch {
    // Both JSON and YAML parsing failed.
  }

  return null
}

export const loadRegistryDocument = async ({
  workspaceStore,
  fetcher,
  namespace,
  slug,
  version,
}: {
  workspaceStore: WorkspaceStore
  fetcher: FetchRegistryDocument
  namespace: string
  slug: string
  version?: string
}): Promise<LoadRegistryDocumentResult> => {
  const documents = workspaceStore.workspace.documents

  const existing = Object.entries(documents).find(([, doc]) => {
    const meta = doc?.['x-scalar-registry-meta']
    return meta?.namespace === namespace && meta?.slug === slug
  })

  if (existing) {
    return { ok: true, documentName: existing[0] }
  }

  const result = await fetcher({ namespace, slug, version })
  if (result.error) {
    return {
      ok: false,
      error: `Failed to fetch document: ${result.message || 'Unknown error'}`,
    }
  }

  const parsed = parseRegistryDocument(result.data)
  if (!parsed) {
    return { ok: false, error: 'Failed to parse registry document' }
  }

  const info = parsed['info']
  const baseName =
    isObject(info) && typeof info['title'] === 'string' && info['title'].length > 0 ? info['title'] : slug

  const documentName = await generateUniqueSlug(baseName, new Set(Object.keys(documents)))

  if (!documentName) {
    return {
      ok: false,
      error: 'Failed to generate a unique name for the document',
    }
  }

  await workspaceStore.addDocument({
    name: documentName,
    document: parsed,
    meta: {
      'x-scalar-registry-meta': { namespace, slug },
    },
  })

  return { ok: true, documentName }
}
