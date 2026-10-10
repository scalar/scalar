import { isObject } from '@scalar/helpers/object/is-object'
import { DEFAULT_MODELS_SECTION_LABEL, type ModelsSectionLabel } from '@scalar/types/api-reference'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getPathItemOperation, getResolvedPathItem } from '@scalar/workspace-store/helpers/for-each-path-item-operation'
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
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { adaptAsyncApiParameters } from '@/components/Content/AsyncApi/helpers/adapt-async-api-parameters'
import {
  resolveAsyncApiChannel,
  resolveAsyncApiMessage,
  resolveAsyncApiOperation,
} from '@/components/Content/AsyncApi/helpers/resolve-async-api-nodes'
import type { FuseData } from '@/features/Search/types'
import { unwrapAsyncApiSchema } from '@/helpers/get-async-api-message-payload-schema'
import { getAsyncApiModelSchema } from '@/helpers/get-async-api-model-schema'
import { isIntroductionEntry } from '@/helpers/is-introduction-entry'
import { createSearchFieldExtractor, extractParameterDescriptions, extractParameterNames } from '@/helpers/openapi'

/** Documents the search index can ingest. Includes OpenAPI and AsyncAPI navigation content. */
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

/** Only JSON Schema-compatible formats can be searched by the shared property walker. */
const getSearchableAsyncApiSchema = (value: unknown): SchemaObject | undefined => {
  const resolved = getResolvedRef(value)
  if (isObject(resolved) && 'schemaFormat' in resolved) {
    const mediaType = String(resolved.schemaFormat).split(';')[0]?.trim().toLowerCase()
    if (
      ![
        'application/schema+json',
        'application/schema+yaml',
        'application/vnd.aai.asyncapi',
        'application/vnd.aai.asyncapi+json',
        'application/vnd.aai.asyncapi+yaml',
      ].includes(mediaType ?? '')
    ) {
      return undefined
    }
  }
  return unwrapAsyncApiSchema(resolved)
}

type CreateSearchIndexOptions = {
  labels?: SearchIndexLabels
  modelsSectionLabel?: ModelsSectionLabel
}

type SearchIndexLabels = {
  heading: string
  tagGroup: string
  webhook: string
  webhooks: string
  introduction: string
}

const DEFAULT_SEARCH_INDEX_LABELS = {
  heading: 'Heading',
  tagGroup: 'Tag Group',
  webhook: 'Webhook',
  webhooks: 'Webhooks',
  introduction: 'Introduction',
} satisfies SearchIndexLabels

/**
 * Create a search index from a list of entries.
 */
export function createSearchIndex(
  document: SearchableDocument | undefined,
  options?: CreateSearchIndexOptions,
): FuseData[] {
  const index: FuseData[] = []
  const extractFields = createSearchFieldExtractor()
  const extractAsyncApiFields = createSearchFieldExtractor({
    maxPropertyDepth: Number.POSITIVE_INFINITY,
    includeArrayItems: true,
  })
  const modelsSectionTitle = options?.modelsSectionLabel ?? DEFAULT_MODELS_SECTION_LABEL
  const labels = options?.labels ?? DEFAULT_SEARCH_INDEX_LABELS

  /**
   * Recursively processes entries and their children to build the search index.
   */
  function processEntries(entriesToProcess: TraversedEntry[]): void {
    entriesToProcess.forEach((entry) => {
      addEntryToIndex(entry, index, document, modelsSectionTitle, labels, extractFields, extractAsyncApiFields)

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
function addEntryToIndex(
  entry: TraversedEntry,
  index: FuseData[],
  document: SearchableDocument | undefined,
  modelsSectionTitle: string,
  labels: SearchIndexLabels,
  extractFields: ReturnType<typeof createSearchFieldExtractor>,
  extractAsyncApiFields: ReturnType<typeof createSearchFieldExtractor>,
): void {
  // OpenAPI-only branches read fields that do not exist on AsyncAPI documents (paths, webhooks,
  // components.schemas). Narrow once here so each branch can dereference safely.
  const openApiDocument = isOpenApiDocument(document) ? document : undefined

  if (isAsyncApiDocument(document)) {
    if (entry.type === 'asyncapi-channel') {
      const channel = resolveAsyncApiChannel(document, entry.channelName)
      const parameters = adaptAsyncApiParameters(channel?.parameters)
      index.push({
        type: entry.type,
        id: entry.id,
        title: entry.title,
        description: channel?.description ?? channel?.summary ?? '',
        identifiers: [entry.channelName],
        path: entry.channelAddress,
        parameters: extractParameterNames(parameters),
        parameterDescriptions: extractParameterDescriptions(parameters),
        bodyDescriptions: channel?.summary ? [channel.summary] : [],
        entry,
      })
      return
    }

    if (entry.type === 'asyncapi-operation') {
      const operation = resolveAsyncApiOperation(document, entry.operationName)
      index.push({
        type: entry.type,
        id: entry.id,
        title: operation?.title || entry.title,
        description: operation?.description ?? operation?.summary ?? '',
        identifiers: [entry.operationName],
        action: entry.action,
        path: entry.channelAddress,
        bodyDescriptions: operation?.summary ? [operation.summary] : [],
        entry,
      })
      return
    }

    if (entry.type === 'asyncapi-message') {
      const message = resolveAsyncApiMessage(document, entry.channelName, entry.messageName)
      const channel = resolveAsyncApiChannel(document, entry.channelName)
      const schemas = [message?.payload, message?.headers].map(getSearchableAsyncApiSchema)
      const fields = schemas.map(extractAsyncApiFields.schema)
      index.push({
        type: entry.type,
        id: entry.id,
        title: message?.title || entry.title,
        description: message?.description ?? message?.summary ?? '',
        identifiers: [entry.messageName, ...(message?.name ? [message.name] : [])],
        path: channel?.address ?? entry.channelName,
        body: [...new Set(fields.flatMap((field) => field.names))],
        bodyDescriptions: [
          ...new Set([
            ...(message?.summary ? [message.summary] : []),
            ...schemas.flatMap((schema) => (schema?.description ? [schema.description] : [])),
            ...fields.flatMap((field) => field.descriptions),
          ]),
        ],
        entry,
      })
      return
    }
  }

  // Operation
  if (entry.type === 'operation') {
    const pathItem = getResolvedPathItem(openApiDocument?.paths?.[entry.path])
    const operation: OperationObject =
      getResolvedRef(getPathItemOperation(openApiDocument?.paths?.[entry.path], entry.method)) ?? {}
    const operationWithPathParams = {
      ...operation,
      parameters: combineParams(pathItem?.parameters, operation.parameters),
    }

    const parameters = extractParameterNames(operationWithPathParams.parameters ?? [])
    const parameterDescriptions = extractParameterDescriptions(operationWithPathParams.parameters ?? [])
    const { names: body, descriptions: bodyDescriptions } = extractFields.body(operationWithPathParams)
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
    const webhook = getResolvedRef(getPathItemOperation(openApiDocument?.webhooks?.[entry.name], entry.method)) ?? {}
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
    const { names: propertyNames, descriptions: propertyDescriptions } = extractFields.schema(schema)

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
      title: modelsSectionTitle,
      description: labels.heading,
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
      title: labels.webhooks,
      description: labels.heading,
      body: '',
      entry,
    })

    return
  }

  // Regular tags, including OpenAPI 3.2 operation-less parent sections (which are `isGroup: true`
  // but real tags), keep their own description.
  if (entry.type === 'tag' && entry.isTagGroup !== true) {
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

  // Legacy `x-tagGroups` wrappers are not real tags, so they carry the generic group label.
  if (entry.type === 'tag' && entry.isTagGroup === true) {
    index.push({
      id: entry.id,
      title: entry.title,
      description: labels.tagGroup,
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
      title: isIntroductionEntry(entry) ? labels.introduction : (entry.title ?? ''),
      description: labels.heading,
      body: '',
      entry,
    })

    return
  }
}
