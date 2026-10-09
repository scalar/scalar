import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

/**
 * Add native navigation parents only when every group has an unambiguous mapping.
 * Keep the extension to preserve renderer-specific ordering and visibility rules.
 */
export const migrateTagGroups = (document: UnknownObject, operationTags: ReadonlySet<string>): void => {
  const groups = document['x-tagGroups']
  if (!Array.isArray(groups) || groups.length === 0) {
    return
  }
  if (document.tags !== undefined && !Array.isArray(document.tags)) {
    return
  }
  const tags: unknown[] = document.tags ?? []
  if (!tags.every((tag): tag is UnknownObject & { name: string } => isObject(tag) && typeof tag.name === 'string')) {
    return
  }
  const existing = new Map(tags.map((tag) => [tag.name, tag]))
  const parents = new Set<string>()
  const children = new Set<string>()
  for (const group of groups) {
    if (
      !isObject(group) ||
      typeof group.name !== 'string' ||
      !group.name ||
      !Array.isArray(group.tags) ||
      !group.tags.every((name) => typeof name === 'string') ||
      Object.keys(group).some((key) => key !== 'name' && key !== 'tags') ||
      parents.has(group.name) ||
      existing.has(group.name) ||
      operationTags.has(group.name)
    ) {
      return
    }
    parents.add(group.name)
    for (const name of group.tags) {
      if (children.has(name) || existing.get(name)?.parent !== undefined) {
        return
      }
      children.add(name)
    }
  }
  if ([...parents].some((name) => children.has(name)) || existing.size !== tags.length) {
    return
  }

  const result: UnknownObject[] = []
  for (const group of groups) {
    result.push({ name: group.name, kind: 'nav' })
    for (const name of group.tags) {
      result.push({ ...(existing.get(name) ?? { name }), parent: group.name })
    }
  }
  document.tags = [...result, ...tags.filter((tag) => !children.has(tag.name))]
}
