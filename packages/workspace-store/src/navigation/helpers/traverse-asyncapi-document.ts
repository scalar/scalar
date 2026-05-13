import { type NavigationOptions, getNavigationOptions } from '@/navigation/get-navigation-options'
import { traverseDescription } from '@/navigation/helpers/traverse-description'
import type { AsyncApiDocument } from '@/schemas/asyncapi/asyncapi-document'
import type { TraversedDocument, TraversedEntry } from '@/schemas/navigation'

/**
 * Build the navigation tree for an AsyncAPI document.
 *
 * MVP scope: introduction + info.description headings via the shared
 * `traverseDescription`. Channels, operations, servers, messages, and bindings
 * are still unrendered and get no sidebar entries.
 */
export const traverseAsyncApiDocument = (
  documentName: string,
  document: AsyncApiDocument,
  options?: NavigationOptions,
): TraversedDocument => {
  const { generateId } = getNavigationOptions(documentName, options)

  const documentId = generateId({
    type: 'document',
    info: document.info,
    name: documentName,
  })

  const entries: TraversedEntry[] = traverseDescription({
    generateId,
    parentId: documentId,
    info: document.info,
  })

  const documentTitle = document.info?.title?.trim() || 'Untitled Document'

  return {
    id: documentId,
    type: 'document',
    title: documentTitle,
    name: documentName,
    children: entries,
  }
}
