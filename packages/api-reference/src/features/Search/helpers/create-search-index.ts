import { DEFAULT_MODELS_SECTION_LABEL, type ModelsSectionLabel } from '@scalar/types/api-reference'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { combineParams } from '@scalar/workspace-store/request-example'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { isAsyncApiDocument, isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import type {
  MediaTypeObject,
  OpenApiDocument,
  OperationObject,
  ResponsesObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { FuseData } from '@/features/Search/types'
import { getAsyncApiModelSchema } from '@/helpers/get-async-api-model-schema'
import {
  extractBodyDescriptions,
  extractBodyFieldNames,
  extractParameterDescriptions,
  extractParameterNames,
  extractSchemaDescriptions,
  extractSchemaFieldNames,
} from '@/helpers/openapi'

/** Documents the search index can ingest. AsyncAPI is supported for headings, tags, and models; channels/operations/messages are not indexed yet. */
type SearchableDocument = OpenApiDocument | AsyncApiDocument

/**
 * Resolves a schema from `components.schemas` for either document type.
 *
 * OpenAPI and AsyncAPI keep reusable schemas in the same place, so model search entries can read
 * property names and descriptions from both. AsyncAPI entries need extra handling (ref siblings,
 * multi-format wrappers, boolean schemas), which lives in {@link getAsyncApiModelSchema}.
 */
function getModelSchema(document: SearchableDocument | undefined, name: string): SchemaObject | undefined {
  if (isOpenApiDocument(document)) {
    return getResolvedRef(document.components?.schemas?.[name])
  }

  if (isAsyncApiDocument(document)) {
    return getAsyncApiModelSchema(document, name)
  }

  return undefined
}

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

type CreateSearchIndexOptions = {
  modelsSectionLabel?: ModelsSectionLabel
}

/**
 * Create a search index from a list of entries.
 */
export function createSearchIndex(
  document: SearchableDocument | undefined,
  options?: CreateSearchIndexOptions,
): FuseData[] {
  const index: FuseData[] = []
  const modelsSectionTitle = options?.modelsSectionLabel ?? DEFAULT_MODELS_SECTION_LABEL

  /**
   * Recursively processes entries and their children to build the search index.
   */
  function processEntries(entriesToProcess: TraversedEntry[]): void {
    entriesToProcess.forEach((entry) => {
      addEntryToIndex(entry, index, document, modelsSectionTitle)

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
 *
 * AsyncAPI documents contribute heading, tag, and model entries here. Their
 * channels, operations, and messages are not indexed yet.
 */
function addEntryToIndex(
  entry: TraversedEntry,
  index: FuseData[],
  document: SearchableDocument | undefined,
  modelsSectionTitle: string,
): void {
  // OpenAPI-only branches read fields that do not exist on AsyncAPI documents (paths, webhooks,
  // components.schemas). Narrow once here so each branch can dereference safely.
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
    const schema = getModelSchema(document, entry.name)
    const schemaDescription = schema?.description ?? ''
    const propertyNames = extractSchemaFieldNames(schema)
    const propertyDescriptions = extractSchemaDescriptions(schema)

    index.push({
      type: 'model',
      title: entry.title,
      description: modelsSectionTitle,
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
      title: entry.title,
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
