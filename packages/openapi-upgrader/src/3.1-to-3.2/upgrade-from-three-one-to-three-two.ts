import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

import { traverse } from '@/helpers/traverse'

import { migrateXmlObjects } from './migrate-xml-objects'


/**
 * Convert navigation groups to the tag hierarchy introduced in OpenAPI 3.2.
 * Keep the original extension when a hierarchy cannot be migrated without losing information.
 */
const migrateTagGroups = (document: UnknownObject): void => {
  if (!Object.hasOwn(document, 'x-tagGroups')) {
    return
  }

  const groups = document['x-tagGroups']
  if (!Array.isArray(groups)) {
    console.warn('Cannot migrate x-tagGroups: expected an array of groups.')
    return
  }

  const tags = new Map<string, Record<string, unknown>>()
  if (document.tags !== undefined && !Array.isArray(document.tags)) {
    console.warn('Cannot migrate x-tagGroups: expected a tags array.')
    return
  }
  for (const tag of document.tags ?? []) {
    if (!isObject(tag) || typeof tag.name !== 'string' || tags.has(tag.name)) {
      console.warn('Cannot migrate x-tagGroups: expected uniquely named tags.')
      return
    }
    tags.set(tag.name, tag)
  }

  const parents = new Map<string, string>()
  const groupNames = new Set<string>()
  for (const group of groups) {
    if (!isObject(group) || typeof group.name !== 'string' || !Array.isArray(group.tags)) {
      console.warn('Cannot migrate x-tagGroups: each group must have a name and a tags array.')
      return
    }
    groupNames.add(group.name)
    for (const name of group.tags) {
      if (typeof name !== 'string') {
        console.warn('Cannot migrate x-tagGroups: group members must be tag names.')
        return
      }
      const parent = parents.get(name)
      if (parent !== undefined && parent !== group.name) {
        console.warn(`Cannot migrate x-tagGroups: tag "${name}" belongs to multiple groups.`)
        return
      }
      parents.set(name, group.name)
    }
  }

  const occupiedNames = new Set([...tags.keys(), ...parents.keys()])
  // Reserve undeclared operation tags too, including callbacks and reusable path items.
  // Conservatively reserving other string-valued tags arrays is harmless.
  traverse(document, (node) => {
    if (Array.isArray(node.tags)) {
      for (const name of node.tags) {
        if (typeof name === 'string') {
          occupiedNames.add(name)
        }
      }
    }
    return node
  })
  const reservedNames = new Set([...occupiedNames, ...groupNames])

  const migrated = new Map<string, Record<string, unknown>>()
  for (const name of groupNames) {
    let groupName = name
    if (occupiedNames.has(name)) {
      groupName = `${name}-group`
      for (let suffix = 2; reservedNames.has(groupName); suffix++) {
        groupName = `${name}-group-${suffix}`
      }
    }
    reservedNames.add(groupName)
    migrated.set(groupName, {
      name: groupName,
      ...(groupName !== name ? { summary: name } : {}),
      kind: 'nav',
    })
    for (const [tagName, parent] of parents) {
      if (parent !== name) {
        continue
      }
      const tag = tags.get(tagName)
      if (tag?.parent !== undefined && tag.parent !== groupName) {
        console.warn(`Cannot migrate x-tagGroups: tag "${tagName}" already has a different parent.`)
        return
      }
      migrated.set(tagName, { ...tag, name: tagName, parent: groupName })
    }
  }
  for (const [name, tag] of tags) {
    if (!migrated.has(name)) {
      migrated.set(name, tag)
    }
  }

  if (groups.length > 0) {
    document.tags = [...migrated.values()]
  }
  delete document['x-tagGroups']
}

/**
 * Upgrade OpenAPI 3.1 to 3.2
 *
 * @see https://github.com/OAI/OpenAPI-Specification/compare/main...v3.2-dev
 */
export function upgradeFromThreeOneToThreeTwo(originalDocument: UnknownObject) {
  // Version
  if (
    originalDocument !== null &&
    typeof originalDocument === 'object' &&
    typeof originalDocument.openapi === 'string' &&
    originalDocument.openapi?.startsWith('3.1')
  ) {
    // Copy the root before writing: callers may obtain it through an untrusted property name.
    const document = { ...originalDocument }
    migrateTagGroups(document)
    document.openapi = '3.2.0'

    // Migrate XML object properties
    migrateXmlObjects(document)

    return document
  }
  // Skip if it's something else than 3.1.x
  return originalDocument
}
