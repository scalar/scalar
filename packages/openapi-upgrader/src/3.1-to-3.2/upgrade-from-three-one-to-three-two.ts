import type { UnknownObject } from '@scalar/types/utils'

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
 * Migrate x-tagGroups to kind property on tags
 */
function migrateTagGroups(document: UnknownObject) {
  if (document['x-tagGroups'] && Array.isArray(document['x-tagGroups'])) {
    const tagGroups = document['x-tagGroups'] as Array<{
      name: string
      tags: string[]
    }>

    // Ensure tags array exists
    if (!document.tags) {
      document.tags = []
    }

    // Create a map of tag names to their group information
    const tagGroupMap = new Map<string, string>()

    for (const group of tagGroups) {
      for (const tagName of group.tags) {
        tagGroupMap.set(tagName, group.name)
      }
    }

    // Update existing tags with kind property based on group name
    if (Array.isArray(document.tags)) {
      for (const tag of document.tags) {
        if (typeof tag === 'object' && tag !== null && 'name' in tag) {
          const groupName = tagGroupMap.get(tag.name as string)
          if (groupName) {
            // Map group names to kind values
            // This is a simplified mapping - in practice, you might want more sophisticated logic
            if (groupName.toLowerCase().includes('nav') || groupName.toLowerCase().includes('navigation')) {
              tag.kind = 'nav'
            } else if (groupName.toLowerCase().includes('audience')) {
              tag.kind = 'audience'
            } else if (groupName.toLowerCase().includes('badge')) {
              tag.kind = 'badge'
            } else {
              // Default to nav for unknown group types
              tag.kind = 'nav'
            }
          }
        }
      }
    }

    // Remove x-tagGroups
    delete document['x-tagGroups']
  }
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
    document.openapi = '3.2.0'
  } else {
    // Skip if it's something else than 3.1.x
    return document
  }

  // Migrate x-tagGroups to kind property
  migrateTagGroups(document)

  // Migrate XML object properties
  migrateXmlObjects(document)

  return document
}
