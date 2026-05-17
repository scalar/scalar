import { buildRegistryItem, registryKey } from '@/features/app/hooks/use-sidebar-documents/helpers/build-registry-item'
import type { SidebarDocumentItem, WorkspaceDocumentEntry } from '@/features/app/hooks/use-sidebar-documents/types'
import type { RegistryDocument } from '@/types/configuration'

/** Project a standalone (non-registry) workspace entry into a sidebar item. */
const toStandaloneItem = (entry: WorkspaceDocumentEntry): SidebarDocumentItem => ({
  key: entry.documentName,
  title: entry.title,
  documentName: entry.documentName,
  registry: undefined,
  navigation: entry.navigation,
  isPinned: entry.isPinned ?? false,
})

/** Groups and merges workspace documents and registry documents into a list of sidebar items. */
export const groupWorkspaceEntries = ({
  isTeamWorkspace,
  workspaceEntries,
  activeDocumentSlug,
  registryDocuments,
}: {
  /** Whether the workspace is a team workspace. */
  isTeamWorkspace: boolean
  /** Current workspace documents list (can be a subset of the full list if the user is viewing a local workspace). */
  workspaceEntries: WorkspaceDocumentEntry[]
  /** Current active document slug. */
  activeDocumentSlug: string | undefined
  /** Registry documents list. */
  registryDocuments: RegistryDocument[]
}) => {
  // Local workspaces: show the flat list as it is. No registry grouping
  if (!isTeamWorkspace) {
    return workspaceEntries.map<SidebarDocumentItem>((entry) => ({
      key: entry.documentName,
      title: entry.title,
      documentName: entry.documentName,
      registry: undefined,
      navigation: entry.navigation,
      isPinned: entry.isPinned ?? false,
    }))
  }

  // 1. Bucket workspace documents by their registry `namespace + slug`.
  //    Documents without registry meta remain standalone entries.
  const workspaceByRegistry = new Map<string, WorkspaceDocumentEntry[]>()
  const standalone: WorkspaceDocumentEntry[] = []

  for (const entry of workspaceEntries) {
    if (!entry.registry) {
      standalone.push(entry)
      continue
    }
    const key = registryKey(entry.registry.namespace, entry.registry.slug)
    const bucket = workspaceByRegistry.get(key)
    if (bucket) {
      bucket.push(entry)
    } else {
      workspaceByRegistry.set(key, [entry])
    }
  }

  // 2. Build entries from the registry, merging in any loaded workspace
  //    counterparts. The registry's version order is preserved so the
  //    "first" version on each entry is the latest one advertised.
  const grouped: SidebarDocumentItem[] = []
  const consumedRegistryKeys = new Set<string>()

  for (const doc of registryDocuments) {
    const key = registryKey(doc.namespace, doc.slug)
    consumedRegistryKeys.add(key)
    const loaded = workspaceByRegistry.get(key) ?? []
    const item = buildRegistryItem({ key, registry: doc, loaded, activeDocumentSlug })
    if (item) {
      grouped.push(item)
    }
  }

  // 3. Workspace docs that point at a registry coordinate the registry has
  //    not advertised (yet) still need to appear in the sidebar so the user
  //    is not stranded without an entry to click.
  for (const [key, loaded] of workspaceByRegistry) {
    if (consumedRegistryKeys.has(key)) {
      continue
    }
    const first = loaded[0]?.registry
    if (!first) {
      continue
    }
    const item = buildRegistryItem({
      key,
      registry: {
        namespace: first.namespace,
        slug: first.slug,
        title: loaded[0]?.title ?? first.slug,
        versions: [],
      },
      loaded,
      activeDocumentSlug,
    })
    if (item) {
      grouped.push(item)
    }
  }

  return [...grouped, ...standalone.map(toStandaloneItem)]
}
