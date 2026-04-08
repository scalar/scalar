import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { generateUniqueValue } from '@/helpers/generate-unique-value'
import { getOperationExamples } from '@/helpers/get-operation-examples'
import { mergeOperations } from '@/helpers/merge-operation'
import { renameOperationExamples } from '@/helpers/rename-operation-example'

export const DEFAULT_EXAMPLE_NAME = 'Default example'

const setPathItemProperty = <K extends keyof OpenAPIV3_1.PathItemObject>(
  target: OpenAPIV3_1.PathItemObject,
  key: K,
  value: OpenAPIV3_1.PathItemObject[K],
): void => {
  target[key] = value
}

export const mergePathItem = (
  paths: OpenAPIV3_1.PathsObject,
  normalizedPathKey: string,
  pathItem: OpenAPIV3_1.PathItemObject,
  mergeOperation: boolean = false,
): void => {
  const targetPath = (paths[normalizedPathKey] ?? {}) as OpenAPIV3_1.PathItemObject
  const pathEntries = objectEntries(pathItem)

  for (const [key, value] of pathEntries) {
    if (value === undefined || value === null) {
      continue
    }

    const isOperationKey = isHttpMethod(key)

    if (isOperationKey && targetPath[key] && mergeOperation) {
      // Get all example names from the target path
      const exampleNames = getOperationExamples(targetPath)

      // Generate a unique example name
      const newExampleName = generateUniqueValue(DEFAULT_EXAMPLE_NAME, (value) => !exampleNames.has(value), '#')

      if (!pathItem[key]) {
        continue
      }

      // Rename operation examples from the new path item (we know it's gonna have only the default example)
      renameOperationExamples(pathItem[key], DEFAULT_EXAMPLE_NAME, newExampleName)

      // Merge the operations
      targetPath[key] = mergeOperations(targetPath[key], pathItem[key])
      continue
    }

    setPathItemProperty(targetPath, key, value)
  }

  paths[normalizedPathKey] = targetPath
}
