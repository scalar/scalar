import type { TagObject } from '@scalar/workspace-store/schemas/v3.2/strict/tag'

/** Keep tag ancestry visible without exceeding Markdown's six heading levels. */
export const getTagSections = (tags: TagObject[], openapiVersion: string): { tag: TagObject; title: string }[] => {
  const nested = /^3\.2\./.test(openapiVersion)
  const label = (tag: TagObject): string => (nested ? (tag.summary ?? tag.name) : tag.name)
  const byName = new Map(tags.map((tag) => [tag.name, tag]))
  // Duplicate names cannot identify a parent unambiguously. Preserve every declaration.
  if (!nested || byName.size !== tags.length) {
    return tags.map((tag) => ({ tag, title: label(tag) }))
  }

  const titles = new Map<string, string>()
  const parents = new Map<string, string>()
  const invalid = new Set<string>()
  for (const tag of tags) {
    const chain: TagObject[] = []
    const seen = new Set<string>()
    const pending = [tag]
    while (pending.length) {
      const current = pending.pop()!
      if (seen.has(current.name) || invalid.has(current.name)) {
        // Invalid cycles and chains leading into them stay flat, like reference navigation.
        for (const member of chain) {
          titles.set(member.name, label(member))
          invalid.add(member.name)
        }
        break
      }
      if (titles.has(current.name)) {
        break
      }
      seen.add(current.name)
      chain.push(current)
      const parent = current.parent === undefined ? undefined : byName.get(current.parent)
      if (parent) {
        pending.push(parent)
      }
    }
    for (const current of chain.reverse()) {
      if (titles.has(current.name)) {
        continue
      }
      const parentTitle = current.parent === undefined ? undefined : titles.get(current.parent)
      titles.set(current.name, parentTitle === undefined ? label(current) : `${parentTitle} › ${label(current)}`)
      if (parentTitle !== undefined && current.parent !== undefined) {
        parents.set(current.name, current.parent)
      }
    }
  }

  const children = new Map<string, TagObject[]>()
  const roots: TagObject[] = []
  for (const tag of tags) {
    const parent = parents.get(tag.name)
    if (parent === undefined) {
      roots.push(tag)
    } else {
      const siblings = children.get(parent) ?? []
      siblings.push(tag)
      children.set(parent, siblings)
    }
  }
  const sections: { tag: TagObject; title: string }[] = []
  const pending = roots.reverse()
  while (pending.length) {
    const tag = pending.pop()!
    sections.push({ tag, title: titles.get(tag.name)! })
    // Use a stack instead of recursion so deeply nested descriptions cannot exhaust the call stack.
    const siblings = children.get(tag.name) ?? []
    for (const child of [...siblings].reverse()) {
      pending.push(child)
    }
  }
  return sections
}
