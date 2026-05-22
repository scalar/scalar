import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import { type NavigationOptions, getNavigationOptions } from '@/navigation/get-navigation-options'
import { traverseDescription } from '@/navigation/helpers/traverse-description'
import type { TraversedDocument, TraversedEntry } from '@/schemas/navigation'
import type { InfoObject } from '@/schemas/v3.1/strict/info'

import { traverseAsyncMessages } from './traverse-async-messages'

/**
 * Build the navigation tree for an AsyncAPI document.
 *
 * MVP scope: introduction + info.description headings (via the shared
 * `traverseDescription`) followed by the `components.messages` container.
 * Channels, operations, servers, and bindings are still unrendered and get
 * no sidebar entries.
 */
export const traverseAsyncDocument = (
  documentName: string,
  document: AsyncApiDocument,
  options?: NavigationOptions,
): TraversedDocument => {
  const { generateId } = getNavigationOptions(documentName, options)

  // The navigation helpers are typed against the OpenAPI Info Object. AsyncAPI's
  // Info Object is a structural subset for the fields they read (title and
  // description), so the cast is safe.
  const info = document.info as unknown as InfoObject

  const documentId = generateId({
    type: 'document',
    info,
    name: documentName,
  })

  const entries: TraversedEntry[] = traverseDescription({
    generateId,
    parentId: documentId,
    info,
  })

  const messages = traverseAsyncMessages({ document, generateId, documentId })
  if (messages.length) {
    entries.push({
      type: 'messages',
      id: generateId({ type: 'messages', parentId: documentId }),
      title: 'Messages',
      name: 'Messages',
      children: messages,
    })
  }

  const documentTitle = document.info?.title?.trim() || 'Untitled Document'

  return {
    id: documentId,
    type: 'document',
    title: documentTitle,
    name: documentName,
    children: entries,
  }
}
