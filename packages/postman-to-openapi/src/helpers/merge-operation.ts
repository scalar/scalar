import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import {
  POSTMAN_EXAMPLE_NAME_EXTENSION,
  POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION,
  POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION,
} from './path-items'

const SCRIPT_MERGE_CONFIG = [
  {
    extensionKey: POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION,
    outputKey: 'x-pre-request' as const,
  },
  {
    extensionKey: POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION,
    outputKey: 'x-post-response' as const,
  },
] as const

/**
 * Merges two OpenAPI OperationObject instances.
 * Assumes that all example names (keys in the 'examples' objects) are unique across both operations.
 * This assumption allows us to shallowly merge example maps without risk of overwriting.
 *
 * @example
 * const op1: OpenAPIV3_1.OperationObject = {
 *   tags: ['user'],
 *   parameters: [
 *     {
 *       name: 'id',
 *       in: 'path',
 *       required: true,
 *       schema: { type: 'string' },
 *       examples: { A: { value: 1 } }
 *     }
 *   ],
 *   requestBody: {
 *     content: {
 *       'application/json': {
 *         examples: { example1: { value: { foo: 'bar' } } }
 *       }
 *     }
 *   }
 * }
 *
 * const op2: OpenAPIV3_1.OperationObject = {
 *   tags: ['admin'],
 *   parameters: [
 *     {
 *       name: 'id',
 *       in: 'path',
 *       required: true,
 *       schema: { type: 'string' },
 *       examples: { B: { value: 2 } }
 *     }
 *   ],
 *   requestBody: {
 *     content: {
 *       'application/json': {
 *         examples: { example2: { value: { hello: 'world' } } }
 *       }
 *     }
 *   }
 * }
 *
 * const merged = mergeOperations(op1, op2)
 * // merged.tags -> ['user', 'admin']
 * // merged.parameters[0].examples -> { B: { value: 2 }, A: { value: 1 } }
 * // merged.requestBody.content['application/json'].examples ->
 * //    { example2: {...}, example1: {...} }
 */
export const mergeOperations = (
  operation1: OpenAPIV3_1.OperationObject,
  operation2: OpenAPIV3_1.OperationObject,
): OpenAPIV3_1.OperationObject => {
  const operation = { ...operation2 }

  // Merge tags (union, preserving uniqueness)
  if (operation1.tags || operation.tags) {
    operation.tags = Array.from(new Set([...(operation1.tags ?? []), ...(operation.tags ?? [])]))
  }

  const parameters = new Map<string, OpenAPIV3_1.ParameterObject>()

  const generateParameterId = (param: OpenAPIV3_1.ParameterObject) => `${param.name}/${param.in}`

  // Seed parameter list from operation2 (the base)
  if (operation.parameters) {
    for (const parameter of operation.parameters) {
      const id = generateParameterId(parameter)
      parameters.set(id, parameter)
    }
  }

  // Merge parameters from operation1 into parameters of operation2.
  // For each parameter, merge their 'examples' objects, assuming example keys are unique.
  if (operation1.parameters) {
    for (const parameter of operation1.parameters) {
      const id = generateParameterId(parameter)
      if (parameters.has(id)) {
        const existingParameter = parameters.get(id)
        if (existingParameter) {
          // Example keys are expected to be unique, so shallow merge is safe.
          existingParameter.examples = {
            ...existingParameter.examples,
            ...parameter.examples,
          }
        }
      } else {
        parameters.set(id, parameter)
      }
    }
  }

  if (parameters.size > 0) {
    operation.parameters = Array.from(parameters.values())
  }

  const contentMediaTypeMap = new Map<string, OpenAPIV3_1.MediaTypeObject>()

  // Seed requestBody content from operation2 (the base)
  if (operation.requestBody?.content) {
    for (const [contentType, mediaType] of Object.entries(operation.requestBody.content)) {
      contentMediaTypeMap.set(contentType, mediaType as OpenAPIV3_1.MediaTypeObject)
    }
  }

  // Merge requestBody content from operation1 into the base.
  // When merging 'examples', we expect example names to be unique (no overwrite).
  if (operation1.requestBody?.content) {
    for (const [contentType, mediaType] of Object.entries(operation1.requestBody.content)) {
      const mediaTypeObj = mediaType as OpenAPIV3_1.MediaTypeObject
      if (contentMediaTypeMap.has(contentType)) {
        const existingMediaType = contentMediaTypeMap.get(contentType)
        if (existingMediaType) {
          if (mediaTypeObj.schema) {
            existingMediaType.schema = mediaTypeObj.schema
          }
          if (mediaTypeObj.example !== undefined && existingMediaType.example === undefined) {
            existingMediaType.example = mediaTypeObj.example
          }
          // Assumption: example names (keys) are unique, so this merge is safe
          existingMediaType.examples = {
            ...existingMediaType.examples,
            ...mediaTypeObj.examples,
          }
        }
      } else {
        contentMediaTypeMap.set(contentType, mediaTypeObj)
      }
    }
  }

  if (contentMediaTypeMap.size > 0) {
    operation.requestBody = {
      ...operation.requestBody,
      content: Object.fromEntries(contentMediaTypeMap) as OpenAPIV3_1.RequestBodyObject['content'],
    }
  }

  operation.responses = {
    ...(operation1.responses ?? {}),
    ...(operation.responses ?? {}),
  }

  operation.summary = mergeSummary(operation1.summary, operation.summary)
  operation.description = mergeDescription(operation1.description, operation.description)

  for (const config of SCRIPT_MERGE_CONFIG) {
    const mergedScripts = mergeScriptsBySource(operation1, operation, config.extensionKey, config.outputKey)
    if (mergedScripts) {
      operation[config.extensionKey] = mergedScripts
    } else {
      delete operation[config.extensionKey]
    }
    updateRenderedScript(operation, config.extensionKey, config.outputKey)
  }
  return operation
}

const mergeSummary = (firstSummary?: string, secondSummary?: string): string | undefined => {
  const first = firstSummary?.trim()
  const second = secondSummary?.trim()
  if (!first && !second) {
    return undefined
  }
  if (!first) {
    return second
  }
  if (!second) {
    return first
  }
  if (first.length < second.length) {
    return first
  }
  return second
}

const mergeDescription = (firstDescription?: string, secondDescription?: string): string | undefined => {
  const values = [firstDescription?.trim(), secondDescription?.trim()].filter(
    (candidate): candidate is string => Boolean(candidate && candidate.length > 0),
  )
  if (values.length === 0) {
    return undefined
  }
  const unique = Array.from(new Set(values))
  return unique.join('\n\n')
}

const mergeScriptsBySource = (
  operation1: OpenAPIV3_1.OperationObject,
  operation2: OpenAPIV3_1.OperationObject,
  extensionKey: (typeof SCRIPT_MERGE_CONFIG)[number]['extensionKey'],
  outputKey: (typeof SCRIPT_MERGE_CONFIG)[number]['outputKey'],
): Record<string, string> | undefined => {
  const scripts = new Map<string, string>()
  const operation1HasScriptMap = addScriptsToMap(scripts, operation1[extensionKey])
  if (!operation1HasScriptMap) {
    addLegacyScriptToMap(scripts, operation1, outputKey)
  }

  const operation2HasScriptMap = addScriptsToMap(scripts, operation2[extensionKey])
  if (!operation2HasScriptMap) {
    addLegacyScriptToMap(scripts, operation2, outputKey)
  }

  if (scripts.size === 0) {
    return undefined
  }

  return Object.fromEntries(scripts)
}

const addScriptsToMap = (target: Map<string, string>, source: unknown): boolean => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return false
  }

  let hasScripts = false
  for (const [name, script] of Object.entries(source)) {
    if (!name || typeof script !== 'string' || script.length === 0) {
      continue
    }
    target.set(name, script)
    hasScripts = true
  }
  return hasScripts
}

const addLegacyScriptToMap = (
  target: Map<string, string>,
  operation: OpenAPIV3_1.OperationObject,
  outputKey: (typeof SCRIPT_MERGE_CONFIG)[number]['outputKey'],
): void => {
  const legacyScript = operation[outputKey]
  if (typeof legacyScript !== 'string' || legacyScript.length === 0) {
    return
  }

  const sourceName =
    typeof operation[POSTMAN_EXAMPLE_NAME_EXTENSION] === 'string' && operation[POSTMAN_EXAMPLE_NAME_EXTENSION].length > 0
      ? operation[POSTMAN_EXAMPLE_NAME_EXTENSION]
      : 'Default example'

  target.set(sourceName, legacyScript)
}

const updateRenderedScript = (
  operation: OpenAPIV3_1.OperationObject,
  extensionKey: (typeof SCRIPT_MERGE_CONFIG)[number]['extensionKey'],
  scriptKey: (typeof SCRIPT_MERGE_CONFIG)[number]['outputKey'],
): void => {
  const scripts = operation[extensionKey]
  if (!scripts || typeof scripts !== 'object' || Array.isArray(scripts)) {
    delete operation[scriptKey]
    return
  }

  const sections = Object.entries(scripts)
    .filter((entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string')
    .map(([sourceName, script]) => `// --- ${sourceName} ---\n${script}`)

  if (sections.length === 0) {
    delete operation[scriptKey]
    return
  }

  operation[scriptKey] = sections.join('\n\n')
}
