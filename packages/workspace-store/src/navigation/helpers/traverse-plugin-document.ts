import { type NavigationOptions, getNavigationOptions } from '@/navigation/get-navigation-options'
import type { TraversedDocument } from '@/schemas/navigation'
import type { DocumentTypeDefinition, PluginDocument } from '@/schemas/plugin-document'

/**
 * Build the navigation root for a document claimed by a registered document type.
 *
 * The root entry (id, title, icon) follows the same conventions as OpenAPI and AsyncAPI documents so the
 * sidebar, document selector and deep links treat it the same way; the children come from the type.
 */
export const traversePluginDocument = (
  documentName: string,
  document: PluginDocument,
  documentType: DocumentTypeDefinition,
  options?: NavigationOptions,
): TraversedDocument => {
  const { generateId } = getNavigationOptions(documentName, options)

  const title = document.info.title?.trim() || 'Untitled Document'
  const documentId = generateId({
    type: 'document',
    info: { title, version: document.info.version ?? '' },
    name: documentName,
  })

  return {
    id: documentId,
    type: 'document',
    title,
    name: documentName,
    children: documentType.traverse({ documentName, documentId, document }),
    icon: document['x-scalar-icon'],
  }
}
