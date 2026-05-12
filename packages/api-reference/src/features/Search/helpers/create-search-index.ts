import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { combineParams } from '@scalar/workspace-store/request-example'
import type { AsyncApiDocument } from '@scalar/workspace-store/schemas/asyncapi/asyncapi-document'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import type {
  MediaTypeObject,
  OpenApiDocument,
  OperationObject,
  ResponsesObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { FuseData } from '@/features/Search/types'
import {
  extractBodyDescriptions,
  extractBodyFieldNames,
  extractParameterDescriptions,
  extractParameterNames,
  extractSchemaDescriptions,
  extractSchemaFieldNames,
} from '@/helpers/openapi'

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
 *
 * Accepts both OpenAPI and AsyncAPI documents — the `x-scalar-navigation` tree
 * lives on both. OpenAPI-specific entry handlers (operation, webhook, model)
 * narrow the document with `isOpenApiDocument` because AsyncAPI documents do
 * not carry `paths`/`webhooks`/`components.schemas`.
 */
export function createSearchIndex(document: OpenApiDocument | AsyncApiDocument | undefined): FuseData[] {
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

  // Both OpenAPI and AsyncAPI documents carry `x-scalar-navigation`. AsyncAPI
  // types it as `unknown`, so we cast loosely to read `children` uniformly.
  const navigation = (document as { 'x-scalar-navigation'?: { children?: TraversedEntry[] } } | undefined)?.[
    'x-scalar-navigation'
  ]
  processEntries(navigation?.children ?? [])

  return index
}

/**
 * Adds a single entry to the search index, handling all entry types recursively.
 */
function addEntryToIndex(
  entry: TraversedEntry,
  index: FuseData[],
  document?: OpenApiDocument | AsyncApiDocument,
): void {
  // OpenAPI-only branches (operation, webhook, model) read `paths`, `webhooks`,
  // and `components.schemas` — fields that only exist on OpenAPI documents.
  // The AsyncAPI navigation tree never emits those entry types, but we narrow
  // here so the union type-checks under TypeScript.
  const openApiDocument = isOpenApiDocument(document) ? document : undefined

  // Operation
  if (entry.type === 'operation') {
    const pathItem = getResolvedRef(openApiDocument?.paths?.[entry.path])
    const operation = (getResolvedRef(pathItem?.[entry.method]) ?? {}) as OperationObject
    const operationWithPathParams = {
      ...operation,
      parameters: combineParams(pathItem?.parameters, operation.parameters),
    }

    const parameters = extractParameterNames(operationWithPathParams.parameters ?? [])
    const parameterDescriptions = extractParameterDescriptions(operationWithPathParams.parameters ?? [])
    const body = extractBodyFieldNames(operationWithPathParams)
    const bodyDescriptions = extractBodyDescriptions(operationWithPathParams)
    const responseExamples = extractResponseExamples(operationWithPathParams.responses)

    index.push({
      type: 'operation',
      title: entry.title,
      id: entry.id,
      description: operationWithPathParams.description || '',
      method: entry.method,
      path: entry.path,
      body,
      bodyDescriptions,
      parameters,
      parameterDescriptions,
      responseExamples,
      operationId: operationWithPathParams.operationId,
      entry,
    })

    return
  }

  // Webhook
  if (entry.type === 'webhook') {
    const webhook = getResolvedRef(openApiDocument?.webhooks?.[entry.name]?.[entry.method]) ?? {}
    const webhookDescription = webhook.description || ''

    index.push({
      id: entry.id,
      type: 'webhook',
      title: entry.title,
      description: 'Webhook',
      method: entry.method,
      body: '',
      bodyDescriptions: webhookDescription ? [webhookDescription] : [],
      operationId: webhook.operationId,
      entry,
    })

    return
  }

  // Model
  if (entry.type === 'model') {
    const schema = getResolvedRef(openApiDocument?.components?.schemas?.[entry.name])
    const schemaDescription = schema?.description ?? ''
    const propertyNames = extractSchemaFieldNames(schema)
    const propertyDescriptions = extractSchemaDescriptions(schema)

    index.push({
      type: 'model',
      title: entry.title,
      description: 'Model',
      id: entry.id,
      body: propertyNames,
      bodyDescriptions: schemaDescription ? [schemaDescription, ...propertyDescriptions] : propertyDescriptions,
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
