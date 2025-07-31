import type { FuseData } from '@/features/Search/types'
import type { TraversedEntry } from '@/features/traverse-schema'
import { createParameterMap, extractRequestBody } from '@/libs/openapi'

/**
 * Create a search index from a list of entries.
 */
export function createSearchIndex(entries: TraversedEntry[]): FuseData[] {
  const index: FuseData[] = []

  /**
   * Recursively processes entries and their children to build the search index.
   */
  function processEntries(entriesToProcess: TraversedEntry[]): void {
    entriesToProcess.forEach((entry) => {
      addEntryToIndex(entry, index)

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
function addEntryToIndex(entry: TraversedEntry, index: FuseData[]): void {
  // Operation
  if ('operation' in entry) {
    const requestBodyOrParameterMap = extractRequestBody(entry.operation) || createParameterMap(entry.operation)
    const body = typeof requestBodyOrParameterMap !== 'boolean' ? requestBodyOrParameterMap : null

    index.push({
      type: 'operation',
      title: entry.title,
      href: `#${entry.id}`,
      id: entry.operation.operationId,
      description: entry.operation.description || '',
      method: entry.method,
      path: entry.path,
      body: body || '',
      entry,
    })

    return
  }

  // Webhook
  if ('webhook' in entry) {
    index.push({
      type: 'webhook',
      title: entry.title,
      href: `#${entry.id}`,
      description: 'Webhook',
      method: entry.method,
      body: entry.webhook.description || '',
      entry,
    })

    return
  }

  // Model
  if ('schema' in entry) {
    const description =
      'description' in entry.schema && typeof entry.schema.description === 'string' ? entry.schema.description : ''

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

  // Tag
  if ('tag' in entry) {
    index.push({
      title: entry.title,
      href: `#${entry.id}`,
      description: entry.tag.description || '',
      type: 'tag',
      body: '',
      entry,
    })

    return
  }

  // Tag group
  if ('isGroup' in entry) {
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

  // Webhooks heading
  if ('isWebhooks' in entry) {
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
