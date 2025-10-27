import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { FuseData } from '@/features/Search/types'
import { createParameterMap, extractRequestBody } from '@/helpers/openapi'

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
    const operation = getResolvedRef(document?.paths?.[entry.path]?.[entry.method]) ?? {}

    const requestBodyOrParameterMap = extractRequestBody(operation) || createParameterMap(operation)
    const body = typeof requestBodyOrParameterMap !== 'boolean' ? requestBodyOrParameterMap : null

    index.push({
      type: 'operation',
      title: entry.title,
      id: entry.id,
      description: operation.description || '',
      method: entry.method,
      path: entry.path,
      body: body || '',
      operationId: operation.operationId,
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
  if (entry.title) {
    index.push({
      id: entry.id,
      type: 'heading',
      title: entry.title ?? '',
      description: 'Description',
      body: '',
      entry,
    })

    return
  }
}
