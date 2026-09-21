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
 * Upgrade OpenAPI 3.1 to 3.2
 *
 * Preserve x-tagGroups because kind categorizes tags and cannot represent group membership.
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

  // Migrate XML object properties
  migrateXmlObjects(document)

  return document
}
