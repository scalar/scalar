import { replaceCircularDependencies } from './replaceCircularReferences'

/**
 * Prints strings, stringifies objects, and handles circular dependencies.
 */
export function prettyPrintString(content: any) {
  if (typeof content === 'string') {
    return content
  }

  if (typeof content === 'object') {
    try {
      return JSON.stringify(content, null, 2)
    } catch (e) {
      return replaceCircularDependencies(content)
    }
  }

  return content
}
