import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { combineParams } from '@scalar/workspace-store/request-example'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import type {
  MediaTypeObject,
  OpenApiDocument,
  OperationObject,
  ResponsesObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { FuseData } from '@/features/Search/types'
import { createParameterMap, extractRequestBody } from '@/helpers/openapi'

function responseExampleValueToString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value)
  } catch (_error) {
    return ''
  }
}

function mediaTypeExamplesToStrings(mediaType: MediaTypeObject): string[] {
  const examplesFromNamedMap = Object.values(mediaType.examples ?? {})
    .flatMap((example) => {
      const resolvedExample = getResolvedRef(example)

      if (!resolvedExample || !('value' in resolvedExample)) {
        return []
      }

      return responseExampleValueToString(resolvedExample.value)
    })
    .filter((value) => value.length > 0)

  const mediaTypeExample =
    'example' in mediaType && mediaType.example !== undefined ? responseExampleValueToString(mediaType.example) : ''

  return mediaTypeExample ? [mediaTypeExample, ...examplesFromNamedMap] : examplesFromNamedMap
}

function extractResponseExamples(responses: ResponsesObject | undefined): string[] {
  if (!responses) {
    return []
  }

  return Object.values(responses)
    .flatMap((response) => {
      const resolvedResponse = getResolvedRef(response)
      if (!resolvedResponse?.content) {
        return []
      }

      return Object.values(resolvedResponse.content).flatMap((mediaType) => {
        const resolvedMediaType = getResolvedRef(mediaType)
        if (!resolvedMediaType) {
          return []
        }

        return mediaTypeExamplesToStrings(resolvedMediaType)
      })
    })
    .filter((value) => value.length > 0)
}

/**
 * Create a search index from a list of entries.
 */
export function createSearchIndex(document: OpenApiDocument | undefined): FuseData[] {
  const index: FuseData[] = []

  /**
   * Recursively processes entries and their children to build the search index.
   */
  function processEntries(entriesToProcess: TraversedEntry[]): void {
    entriesToProcess.forEach((entry) => {
      addEntryToIndex(entry, index, document)

      // Recursively process children if they exist
      if ('children' in entry && entry.children) {
        processEntries(entry.children)
      }
    })
  }

  processEntries(document?.['x-scalar-navigation']?.children ?? [])

  return index
}

/**
 * Adds a single entry to the search index, handling all entry types recursively.
 */
function addEntryToIndex(entry: TraversedEntry, index: FuseData[], document?: OpenApiDocument): void {
  // Operation
  if (entry.type === 'operation') {
    const pathItem = getResolvedRef(document?.paths?.[entry.path])
    const operation = (getResolvedRef(pathItem?.[entry.method]) ?? {}) as OperationObject
    const operationWithPathParams = {
      ...operation,
      parameters: combineParams(pathItem?.parameters, operation.parameters),
    }

    const body = extractRequestBody(operationWithPathParams) ?? createParameterMap(operationWithPathParams)
    const responseExamples = extractResponseExamples(operationWithPathParams.responses)

    index.push({
      type: 'operation',
      title: entry.title,
      id: entry.id,
      description: operationWithPathParams.description || '',
      method: entry.method,
      path: entry.path,
      body: body || '',
      responseExamples,
      operationId: operationWithPathParams.operationId,
      entry,
    })

    return
  }

  // Webhook
  if (entry.type === 'webhook') {
    const webhook = getResolvedRef(document?.webhooks?.[entry.name]?.[entry.method]) ?? {}

    index.push({
      id: entry.id,
      type: 'webhook',
      title: entry.title,
      description: 'Webhook',
      method: entry.method,
      body: webhook.description || '',
      operationId: webhook.operationId,
      entry,
    })

    return
  }

  // Model
  if (entry.type === 'model') {
    const schema = getResolvedRef(document?.components?.schemas?.[entry.name])

    const description = schema?.description ?? ''

    index.push({
      type: 'model',
      title: entry.title,
      description: 'Model',
      id: entry.id,
      body: description,
      entry,
    })

    return
  }

  // Models heading
  if (entry.type === 'models') {
    index.push({
      id: entry.id,
      type: 'heading',
      title: 'Models',
      description: 'Heading',
      body: '',
      entry,
    })

    return
  }

  // Tag
  if (entry.type === 'tag' && entry.isWebhooks === true) {
    index.push({
      id: entry.id,
      type: 'heading',
      title: 'Webhooks',
      description: 'Heading',
      body: '',
      entry,
    })

    return
  }

  if (entry.type === 'tag' && entry.isGroup === false) {
    index.push({
      id: entry.id,
      title: entry.title,
      description: entry.description || '',
      type: 'tag',
      body: '',
      entry,
    })

    return
  }

  // Tag group
  if (entry.type === 'tag' && entry.isGroup === true) {
    index.push({
      id: entry.id,
      title: entry.title,
      description: 'Tag Group',
      type: 'tag',
      body: '',
      entry,
    })

    return
  }

  // Headings from info.description
  if (entry.type === 'text') {
    index.push({
      id: entry.id,
      type: 'heading',
      title: entry.title ?? '',
      description: 'Heading',
      body: '',
      entry,
    })

    return
  }
}
