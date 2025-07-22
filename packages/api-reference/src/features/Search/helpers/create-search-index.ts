import type { FuseData } from '@/features/Search/types'
import type { TraversedEntry } from '@/features/traverse-schema'
import { createParameterMap, extractRequestBody } from '@/libs/openapi'

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
  if ('operation' in entry) {
    // Handle operations
    const parameterMap = createParameterMap(entry.operation)
    const bodyData = extractRequestBody(entry.operation) || parameterMap
    let body = null
    if (typeof bodyData !== 'boolean') {
      body = bodyData
    }

    const operationData: FuseData = {
      type: 'req',
      title: entry.title,
      href: `#${entry.id}`,
      operationId: entry.operation.operationId,
      description: entry.operation.description ?? '',
      httpVerb: entry.method,
      path: entry.path,
      body: body || '',
    }

    index.push(operationData)
  } else if ('webhook' in entry) {
    // Handle webhooks
    const webhookData: FuseData = {
      type: 'webhook',
      title: entry.title,
      href: `#${entry.id}`,
      description: 'Webhook',
      httpVerb: entry.method,
      body: '',
    }

    index.push(webhookData)
  } else if ('schema' in entry) {
    // Handle schemas/models
    const modelData: FuseData = {
      type: 'model',
      title: entry.title,
      href: `#${entry.id}`,
      description: 'Model',
      body: '',
    }

    index.push(modelData)
  } else if ('tag' in entry) {
    // Handle tags
    const tagData: FuseData = {
      title: entry.title,
      href: `#${entry.id}`,
      description: entry.tag.description || '',
      type: 'tag',
      body: '',
    }

    index.push(tagData)
  } else if ('isGroup' in entry) {
    // Tag group heading
  } else if ('isModel' in entry) {
    // Model heading
  } else if ('isWebhooks' in entry) {
    // Webhooks heading
  }
  // TODO: This is dangerous, don't we have a better way to filter out the Models heading?
  else if (entry.title === 'Models') {
    // Models heading
  }
  // Handle descriptions
  else {
    const descriptionData: FuseData = {
      type: 'heading',
      title: 'Introduction',
      description: entry.title ?? '',
      href: entry.id,
      body: '',
    }

    index.push(descriptionData)
  }
}
