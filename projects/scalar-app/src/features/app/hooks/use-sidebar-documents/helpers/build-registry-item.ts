import { computeVersionStatus } from '@/features/app/helpers/compute-version-status'
import type {
  SidebarDocumentItem,
  SidebarDocumentVersion,
  WorkspaceDocumentEntry,
} from '@/features/app/hooks/use-sidebar-documents/types'
import type { RegistryDocument } from '@/types/configuration'

export const registryKey = (namespace: string, slug: string) => `@${namespace}/${slug}`

const versionKey = (namespace: string, slug: string, version: string) => `${registryKey(namespace, slug)}@${version}`

/**
 * Build a single registry-backed sidebar item. The version list is assembled
 * by walking the registry's advertised versions in order and pairing them
 * with any loaded workspace document that claims the same `version` string.
 * Loaded versions that the registry has not advertised are appended at the
 * end so they stay visible until the registry catches up.
 */
export const buildRegistryItem = ({
  key,
  registry,
  loaded,
  activeDocumentSlug,
}: {
  key: string
  registry: RegistryDocument
  loaded: WorkspaceDocumentEntry[]
  activeDocumentSlug: string | undefined
}): SidebarDocumentItem | undefined => {
  // Index loaded workspace docs by the version they claim. A workspace doc
  // that does not declare a `version` is treated as an orphan and pushed to
  // the bottom of the version list — it still belongs to the group but we
  // cannot reconcile it with the registry.
  const loadedByVersion = new Map<string, WorkspaceDocumentEntry>()
  const orphans: WorkspaceDocumentEntry[] = []

  for (const entry of loaded) {
    const version = entry.registry?.version
    if (!version) {
      orphans.push(entry)
      continue
    }
    if (loadedByVersion.has(version)) {
      // Multiple workspace docs claim the same version; keep the first one
      // (registry order wins) and surface the rest as orphans so they remain
      // visible instead of silently disappearing.
      orphans.push(entry)
      continue
    }
    loadedByVersion.set(version, entry)
  }

  const versions: SidebarDocumentVersion[] = []

  // Registry-backed rows always surface the registry title so the sidebar
  // matches what the registry advertises. Local renames are intentionally
  // ignored here; the slug is the last-resort fallback so the row always has
  // something to render.
  const groupTitle = registry.title || registry.slug

  // Build the drafts list first: entries left in `loadedByVersion` after we
  // remove every version the registry advertises. The workspace store
  // preserves insertion order, so the newest draft is naturally last —
  // reverse it here to surface the most recently created draft first.
  const draftEntries: [string, WorkspaceDocumentEntry][] = []
  for (const [version, match] of loadedByVersion) {
    if (registry.versions.some((v) => v.version === version)) {
      continue
    }
    draftEntries.push([version, match])
  }
  draftEntries.reverse()

  // Drafts go on top: the user just created them and the registry has not
  // seen them yet, so they are the most relevant rows in the picker.
  // Drafts never carry the "Latest" badge — that label always belongs to
  // the latest registry-advertised version, regardless of row position.
  for (const [version, match] of draftEntries) {
    versions.push({
      key: match.documentName,
      version,
      title: groupTitle,
      documentName: match.documentName,
      commitHash: match.registry?.commitHash,
      registryCommitHash: undefined,
      status: computeVersionStatus({
        isLoaded: true,
        localHash: match.registry?.commitHash,
        registryHash: undefined,
        isDirty: match.isDirty,
      }),
      isLatest: false,
      navigation: match.navigation,
    })
  }

  // Then the registry-advertised versions, in the order the registry
  // returned them (latest first by convention). The first one is the
  // canonical "latest" — flagged here so the picker can render the badge
  // independent of row order in the array.
  registry.versions.forEach((v, registryIndex) => {
    const match = loadedByVersion.get(v.version)
    const localHash = match?.registry?.commitHash
    const registryHash = v.commitHash
    versions.push({
      key: match ? match.documentName : versionKey(registry.namespace, registry.slug, v.version),
      version: v.version,
      title: groupTitle,
      documentName: match?.documentName,
      commitHash: localHash,
      registryCommitHash: registryHash,
      status: computeVersionStatus({
        isLoaded: Boolean(match),
        localHash,
        registryHash,
        isDirty: match?.isDirty,
        conflictCheckedAgainstHash: match?.registry?.conflictCheckedAgainstHash,
        hasConflict: match?.registry?.hasConflict,
      }),
      isLatest: registryIndex === 0,
      navigation: match?.navigation,
    })
  })

  // Loaded docs that did not declare a version at all.
  for (const orphan of orphans) {
    versions.push({
      key: orphan.documentName,
      version: orphan.registry?.version ?? '',
      title: groupTitle,
      documentName: orphan.documentName,
      commitHash: orphan.registry?.commitHash,
      registryCommitHash: undefined,
      status: computeVersionStatus({
        isLoaded: true,
        localHash: orphan.registry?.commitHash,
        registryHash: undefined,
        isDirty: orphan.isDirty,
      }),
      isLatest: false,
      navigation: orphan.navigation,
    })
  }

  if (versions.length === 0) {
    return undefined
  }

  // Pick the active version: prefer a loaded match against the active
  // document slug, then any loaded version, then fall back to the first
  // version (the latest advertised by the registry).
  const activeVersion =
    versions.find((v) => v.documentName !== undefined && v.documentName === activeDocumentSlug) ??
    versions.find((v) => v.documentName !== undefined) ??
    versions[0]!

  return {
    key,
    title: groupTitle,
    documentName: activeVersion.documentName,
    registry: { namespace: registry.namespace, slug: registry.slug },
    navigation: activeVersion.navigation,
    isPinned: loaded.some((e) => e.isPinned),
    versions,
    activeVersionKey: activeVersion.key,
  }
}
