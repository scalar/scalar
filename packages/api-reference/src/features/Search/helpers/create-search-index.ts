import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OpenApiDocument, TraversedEntry } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { FuseData } from '@/features/Search/types'
import { createParameterMap, extractRequestBody } from '@/libs/openapi'

/**
 * Create a search index from a list of entries.
 */
export function createSearchIndex(entries: TraversedEntry[], document?: OpenApiDocument): FuseData[] {
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

  processEntries(entries)

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
      href: `#${entry.id}`,
      id: operation.operationId,
      description: operation.description || '',
      method: entry.method,
      path: entry.path,
      body: body || '',
      entry,
    })

    return
  }

  // Webhook
  if (entry.type === 'webhook') {
    const webhook = getResolvedRef(document?.webhooks?.[entry.name]?.[entry.method]) ?? {}

    index.push({
      type: 'webhook',
      title: entry.title,
      href: `#${entry.id}`,
      description: 'Webhook',
      method: entry.method,
      body: webhook.description || '',
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
      href: `#${entry.id}`,
      description: 'Model',
      body: description,
      entry,
    })

    return
  }

  // Models heading
  if (entry.title === 'Models') {
    index.push({
      type: 'heading',
      title: 'Models',
      href: `#${entry.id}`,
      description: 'Heading',
      body: '',
      entry,
    })

    return
  }

  // Tag
  if (entry.type === 'tag' && entry.isWebhooks === true) {
    index.push({
      type: 'heading',
      title: 'Webhooks',
      href: `#${entry.id}`,
      description: 'Heading',
      body: '',
      entry,
    })

    return
  }

  if (entry.type === 'tag' && entry.isGroup === false) {
    index.push({
      title: entry.title,
      href: `#${entry.id}`,
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
      title: entry.title,
      href: `#${entry.id}`,
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
      type: 'heading',
      title: entry.title ?? '',
      description: 'Description',
      href: `#${entry.id}`,
      body: '',
      entry,
    })

    return
  }
}
