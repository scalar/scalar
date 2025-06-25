import type { AnyObject } from '@/types/index'
import { traverse } from './traverse'

/**
 * Walks through the specification and returns all references as an array.
 *
 * Warning: Doesn't return internal references.
 */
export function getListOfReferences(specification: AnyObject) {
  const references: string[] = []

  // Make sure we're dealing with an object
  if (!specification || typeof specification !== 'object') {
    return references
  }

  // Traverse the specification and collect all references
  traverse(specification, (value: any) => {
    if (value.$ref && typeof value.$ref === 'string' && !value.$ref.startsWith('#')) {
      references.push(value.$ref.split('#')[0])
    }

    return value
  })

  // Remove duplicates
  return [...new Set(references)]
}
