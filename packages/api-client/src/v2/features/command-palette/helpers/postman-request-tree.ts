export type PostmanTreeNode = {
  path: readonly number[]
  name: string
  isFolder: boolean
  method?: string
  children?: PostmanTreeNode[]
}

type LooseItem = {
  name?: string
  item?: LooseItem[]
  request?: unknown
}

export const pathKey = (path: readonly number[]): string => JSON.stringify([...path])

/**
 * Inverse of {@link pathKey}: parses stable request index path JSON from the UI.
 * Returns undefined for malformed input.
 */
export const parsePostmanPathKey = (key: string): readonly number[] | undefined => {
  try {
    const parsed = JSON.parse(key) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return undefined
    }
    for (const n of parsed) {
      if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
        return undefined
      }
    }
    return parsed as readonly number[]
  } catch {
    return undefined
  }
}

/** Maps UI path keys to `ConvertOptions.requestIndexPaths`; invalid keys are skipped. */
export const pathKeysToRequestIndexPaths = (keys: readonly string[]): number[][] => {
  const out: number[][] = []
  for (const key of keys) {
    const path = parsePostmanPathKey(key)
    if (path !== undefined) {
      out.push([...path])
    }
  }
  return out
}

const isPostmanFolderNode = (node: unknown): node is { item: LooseItem[] } => {
  if (node === null || node === undefined || typeof node !== 'object') {
    return false
  }
  return 'item' in node && Array.isArray((node as { item: unknown }).item)
}

/**
 * Resolves the Postman JSON node at `path` (indices into root `item`, then each folder’s `item`).
 * Matches {@link buildPostmanRequestTree} paths and postman-to-openapi `getNodeAtPath`.
 */
export const getPostmanItemAtIndexPath = (itemRoot: unknown, path: readonly number[]): unknown => {
  if (!Array.isArray(itemRoot) || path.length === 0) {
    return undefined
  }
  let list: unknown[] = itemRoot
  let node: unknown
  for (let i = 0; i < path.length; i++) {
    const idx = path[i]
    if (typeof idx !== 'number' || idx < 0 || idx >= list.length) {
      return undefined
    }
    node = list[idx]
    if (node === undefined) {
      return undefined
    }
    if (i < path.length - 1) {
      if (!isPostmanFolderNode(node)) {
        return undefined
      }
      list = node.item
    }
  }
  return node
}

export const extractRequestMethod = (request: unknown): string => {
  if (typeof request === 'string') {
    return 'get'.toLowerCase()
  }
  if (request && typeof request === 'object' && 'method' in request) {
    const method = (request as { method?: string }).method
    if (typeof method === 'string' && method.length > 0) {
      return method.toLowerCase()
    }
  }
  return 'get'.toLowerCase()
}

/**
 * Builds a shallow tree of folders and requests from a Postman `item` array.
 * Paths are indices from the collection root through nested `item` arrays.
 */
export const buildPostmanRequestTree = (items: unknown): PostmanTreeNode[] => {
  if (!Array.isArray(items)) {
    return []
  }

  const walk = (list: LooseItem[], prefix: number[]): PostmanTreeNode[] =>
    list.map((raw, index) => {
      const path = [...prefix, index]
      const name = typeof raw?.name === 'string' && raw.name.length > 0 ? raw.name : 'Untitled'

      if (raw?.item !== undefined && Array.isArray(raw.item)) {
        return {
          path,
          name,
          isFolder: true,
          children: walk(raw.item as LooseItem[], path),
        }
      }

      if (raw?.request !== undefined) {
        return {
          path,
          name,
          isFolder: false,
          method: extractRequestMethod(raw.request),
        }
      }

      return {
        path,
        name,
        isFolder: true,
        children: [],
      }
    })

  return walk(items as LooseItem[], [])
}

/** Counts Postman request leaves in an `item` array (same rules as {@link buildPostmanRequestTree}). */
export const countPostmanRequestLeaves = (items: unknown): number => {
  if (!Array.isArray(items)) {
    return 0
  }
  const walk = (list: LooseItem[]): number =>
    list.reduce((sum, raw) => {
      if (raw?.item !== undefined && Array.isArray(raw.item)) {
        return sum + walk(raw.item as LooseItem[])
      }
      if (raw?.request !== undefined) {
        return sum + 1
      }
      return sum
    }, 0)
  return walk(items as LooseItem[])
}

/** Path keys for every request leaf in the tree (depth-first). */
export const collectAllRequestPathKeys = (nodes: PostmanTreeNode[]): string[] => {
  const keys: string[] = []
  for (const node of nodes) {
    if (node.isFolder) {
      keys.push(...collectAllRequestPathKeys(node.children ?? []))
    } else {
      keys.push(pathKey(node.path))
    }
  }
  return keys
}

export const collectRequestPathKeysUnderFolder = (node: PostmanTreeNode): string[] => {
  if (!node.isFolder) {
    return [pathKey(node.path)]
  }
  return collectAllRequestPathKeys(node.children ?? [])
}

/** Returns a new selection list after toggling one request path key. */
export const applyPostmanRequestSelectionChange = (
  selectedKeys: readonly string[],
  key: string,
  selected: boolean,
): string[] => {
  const next = new Set(selectedKeys)
  if (selected) {
    next.add(key)
  } else {
    next.delete(key)
  }
  return [...next]
}

/** Returns a new selection list after selecting or clearing every request under a folder. */
export const applyPostmanFolderSelectionChange = (
  selectedKeys: readonly string[],
  node: PostmanTreeNode,
  selected: boolean,
): string[] => {
  const keys = collectRequestPathKeysUnderFolder(node)
  const next = new Set(selectedKeys)
  for (const key of keys) {
    if (selected) {
      next.add(key)
    } else {
      next.delete(key)
    }
  }
  return [...next]
}

/** Number of request leaves under this node (0 for empty folders). */
export const countRequestLeaves = (node: PostmanTreeNode): number => {
  if (!node.isFolder) {
    return 1
  }
  return (node.children ?? []).reduce((sum, child) => sum + countRequestLeaves(child), 0)
}

export const folderFullySelected = (node: PostmanTreeNode, selected: ReadonlySet<string>): boolean => {
  const keys = collectRequestPathKeysUnderFolder(node)
  return keys.length > 0 && keys.every((key) => selected.has(key))
}

/** True when at least one descendant request is selected but not all. */
export const folderHasPartialSelection = (node: PostmanTreeNode, selected: ReadonlySet<string>): boolean => {
  const keys = collectRequestPathKeysUnderFolder(node)
  if (keys.length === 0) {
    return false
  }
  let selectedCount = 0
  for (const key of keys) {
    if (selected.has(key)) {
      selectedCount++
    }
  }
  return selectedCount > 0 && selectedCount < keys.length
}
