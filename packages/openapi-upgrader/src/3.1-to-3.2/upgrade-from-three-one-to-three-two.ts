import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

import { traverse } from '@/helpers/traverse'

/**
 * Recursively migrate XML object properties from 3.1 to 3.2 format
 */
function migrateXmlObjects(obj: any): void {
  if (obj === null || typeof obj !== 'object') {
    return
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    for (const item of obj) {
      migrateXmlObjects(item)
    }
    return
  }

  // Handle xml property migration
  if (obj.xml && typeof obj.xml === 'object') {
    if (obj.xml.wrapped === true && obj.xml.attribute === true) {
      throw new Error('Invalid XML configuration: wrapped and attribute cannot be true at the same time.')
    }

    // Migrate wrapped: true to nodeType: 'element'
    if (obj.xml.wrapped === true) {
      delete obj.xml.wrapped
      obj.xml.nodeType = 'element'
    }

    // Migrate attribute: true to nodeType: 'attribute'
    if (obj.xml.attribute === true) {
      delete obj.xml.attribute
      obj.xml.nodeType = 'attribute'
    }
  }

  // Recursively process all object properties
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      migrateXmlObjects(obj[key])
    }
  }
}

/**
 * Convert navigation groups to the tag hierarchy introduced in OpenAPI 3.2.
 * Reject ambiguous hierarchies instead of silently discarding group membership.
 */
const migrateTagGroups = (document: UnknownObject): void => {
  if (!Object.hasOwn(document, 'x-tagGroups')) {
    return
  }

  const groups = document['x-tagGroups']
  if (!Array.isArray(groups)) {
    throw new Error('Cannot migrate x-tagGroups: expected an array of groups.')
  }

  const tags = new Map<string, Record<string, unknown>>()
  if (document.tags !== undefined && !Array.isArray(document.tags)) {
    throw new Error('Cannot migrate x-tagGroups: expected a tags array.')
  }
  for (const tag of document.tags ?? []) {
    if (!isObject(tag) || typeof tag.name !== 'string' || tags.has(tag.name)) {
      throw new Error('Cannot migrate x-tagGroups: expected uniquely named tags.')
    }
    tags.set(tag.name, tag)
  }

  const parents = new Map<string, string>()
  const groupNames = new Set<string>()
  for (const group of groups) {
    if (!isObject(group) || typeof group.name !== 'string' || !Array.isArray(group.tags)) {
      throw new Error('Cannot migrate x-tagGroups: each group must have a name and a tags array.')
    }
    groupNames.add(group.name)
    for (const name of group.tags) {
      if (typeof name !== 'string') {
        throw new Error('Cannot migrate x-tagGroups: group members must be tag names.')
      }
      const parent = parents.get(name)
      if (parent !== undefined && parent !== group.name) {
        throw new Error(`Cannot migrate x-tagGroups: tag "${name}" belongs to multiple groups.`)
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
        throw new Error(`Cannot migrate x-tagGroups: tag "${tagName}" already has a different parent.`)
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
  const document = originalDocument

  // Version
  if (
    document !== null &&
    typeof document === 'object' &&
    typeof document.openapi === 'string' &&
    document.openapi?.startsWith('3.1')
  ) {
    migrateTagGroups(document)
    document.openapi = '3.2.0'
  } else {
    // Skip if it's something else than 3.1.x
    return document
  }

  // Migrate XML object properties
  migrateXmlObjects(document)

  return document
}
