import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { generateUniqueValue } from '@/helpers/generate-unique-value'
import { getOperationExamples } from '@/helpers/get-operation-examples'
import { mergeOperations } from '@/helpers/merge-operation'
import { renameOperationExamples } from '@/helpers/rename-operation-example'

export const DEFAULT_EXAMPLE_NAME = 'Default example'

export const OPERATION_KEYS: readonly (keyof OpenAPIV3_1.PathItemObject)[] = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
]

export const mergePathItem = (
  paths: OpenAPIV3_1.PathsObject,
  normalizedPathKey: string,
  pathItem: OpenAPIV3_1.PathItemObject,
  mergeOperation: boolean = false,
): void => {
  const targetPath = (paths[normalizedPathKey] ?? {}) as OpenAPIV3_1.PathItemObject

  for (const [key, value] of Object.entries(pathItem) as [
    keyof OpenAPIV3_1.PathItemObject,
    OpenAPIV3_1.PathItemObject[keyof OpenAPIV3_1.PathItemObject],
  ][]) {
    if (value === undefined) {
      continue
    }

    const isOperationKey = OPERATION_KEYS.includes(key)

    if (isOperationKey && targetPath[key] && mergeOperation) {
      // Get all example names from the target path
      const exampleNames = getOperationExamples(targetPath)

      // Generate a unique example name
      const newExampleName = generateUniqueValue(DEFAULT_EXAMPLE_NAME, (value) => !exampleNames.has(value), '#')
      // Rename operation examples from the new path item (we know it's gonna have only the default example)
      renameOperationExamples(pathItem[key], DEFAULT_EXAMPLE_NAME, newExampleName)
      // Merge the operations
      targetPath[key] = mergeOperations(targetPath[key], pathItem[key])
      continue
    }

    targetPath[key] = value
  }

  paths[normalizedPathKey] = targetPath
}
