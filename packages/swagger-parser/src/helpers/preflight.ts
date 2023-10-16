import type { AnyObject } from '../types'

/**
 * This function analyzes a spec without parsing it. The values are inaccurate, but it’s much faster.
 */
export const preflight = (value: AnyObject) => {
  const hasTitle = value.info?.title !== undefined

  const hasDescription = value.info?.description !== undefined

  const numberOfTags = value.tags?.length ?? 0

  const numberOfOperations = Object.keys(value.paths).reduce(
    (sum, path) => sum + Object.keys(value.paths[path]).length,
    0,
  )

  return {
    hasTitle,
    hasDescription,
    numberOfTags,
    numberOfOperations,
  }
}
