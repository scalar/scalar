import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { generateUniqueValue } from '@/helpers/generate-unique-value'
import { getOperationExamples } from '@/helpers/get-operation-examples'
import { mergeOperations } from '@/helpers/merge-operation'
import {
  POSTMAN_EXAMPLE_NAME_EXTENSION,
  POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION,
  POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION,
} from '@/helpers/path-items'
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
      const incomingOperation = pathItem[key] as OpenAPIV3_1.OperationObject
      const sourceName =
        typeof incomingOperation[POSTMAN_EXAMPLE_NAME_EXTENSION] === 'string'
          ? incomingOperation[POSTMAN_EXAMPLE_NAME_EXTENSION]
          : DEFAULT_EXAMPLE_NAME

      // Get all example names from the target path
      const exampleNames = getOperationExamples(targetPath)

      // Generate a unique example name
      const newExampleName = generateUniqueValue(sourceName, (value) => !exampleNames.has(value), '#')
      // Rename operation examples from the new path item if this source name already exists
      renameOperationExamples(incomingOperation, sourceName, newExampleName)
      updateExtensionKey(incomingOperation, POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION, sourceName, newExampleName)
      updateExtensionKey(incomingOperation, POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION, sourceName, newExampleName)
      incomingOperation[POSTMAN_EXAMPLE_NAME_EXTENSION] = newExampleName
      // Merge the operations
      targetPath[key] = mergeOperations(targetPath[key], incomingOperation)
      continue
    }

    targetPath[key] = value
  }

  paths[normalizedPathKey] = targetPath
}

const updateExtensionKey = (
  operation: OpenAPIV3_1.OperationObject,
  extensionKey: string,
  oldKey: string,
  newKey: string,
): void => {
  if (oldKey === newKey) {
    return
  }

  const map = operation[extensionKey]
  if (!map || typeof map !== 'object' || Array.isArray(map)) {
    return
  }

  const castedMap = map as Record<string, unknown>
  const value = castedMap[oldKey]
  if (value === undefined) {
    return
  }

  delete castedMap[oldKey]
  castedMap[newKey] = value
}
