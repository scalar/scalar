import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import { slug } from 'github-slugger'

import type { TraverseSpecOptions } from '@/navigation/types'
import type { IdGenerator } from '@/schemas/navigation'

export type NavigationOptions =
  | Partial<
      Pick<
        ApiReferenceConfigurationRaw,
        | 'generateHeadingSlug'
        | 'generateTagSlug'
        | 'generateOperationSlug'
        | 'generateWebhookSlug'
        | 'generateModelSlug'
        | 'operationsSorter'
        | 'tagsSorter'
        | 'hideModels'
      >
    >
  | undefined

/**
 * Returns options for traversing an OpenAPI document, allowing customization of
 * how IDs and slugs are generated for tags, headings, models, operations, and webhooks.
 * The returned options can be influenced by the provided DocumentConfiguration
 */
export const getNavigationOptions = (documentName: string, options?: NavigationOptions): TraverseSpecOptions => {
  const generateId: IdGenerator = (props) => {
    const documentId = `${slug(documentName)}`

    // -------- Default text id generation logic --------
    if (props.type === 'text') {
      if (options?.generateHeadingSlug) {
        return options?.generateHeadingSlug({ slug: props.slug })
      }

      if (props.slug) {
        return `${documentId}/description/${props.slug}`
      }

      return `${documentId}/`
    }

    // -------- Default tag id generation logic --------
    if (props.type === 'tag') {
      if (options?.generateTagSlug) {
        return `${documentId}/tag/${options.generateTagSlug(props.tag)}`
      }

      return `${documentId}/tag/${slug(props.tag.name ?? '')}`
    }

    // -------- Default operation id generation logic --------
    if (props.type === 'operation') {
      const prefixTag = props.parentTag
        ? `${generateId({
            type: 'tag',
            tag: props.parentTag.tag,
            parentId: props.parentTag.id,
          })}/`
        : `${documentId}/`

      if (options?.generateOperationSlug) {
        return `${prefixTag}${options.generateOperationSlug({
          path: props.path,
          operationId: props.operation.operationId,
          method: props.method.toUpperCase(),
          summary: props.operation.summary,
        })}`
      }

      return `${prefixTag}${props.method.toUpperCase()}${props.path}`
    }

    // -------- Default webhook id generation logic --------
    if (props.type === 'webhook') {
      const prefixTag = props.parentTag
        ? `${generateId({
            type: 'tag',
            parentId: props.parentTag.id,
            tag: props.parentTag.tag,
          })}/`
        : `${documentId}/`

      if (options?.generateWebhookSlug) {
        return `${prefixTag}webhook/${options.generateWebhookSlug({
          name: props.name,
          method: props.method?.toUpperCase(),
        })}`
      }

      return `${prefixTag}webhook/${props.method?.toUpperCase()}/${slug(props.name)}`
    }

    // -------- Default model id generation logic --------
    if (props.type === 'model') {
      if (!props.name) {
        return `${documentId}/models`
      }

      const prefixTag = props.parentTag
        ? `${generateId({
            type: 'tag',
            parentId: props.parentTag.id,
            tag: props.parentTag.tag,
          })}/`
        : `${documentId}/`

      if (options?.generateModelSlug) {
        return `${prefixTag}model/${options.generateModelSlug({
          name: props.name,
        })}`
      }

      return `${prefixTag}model/${slug(props.name)}`
    }

    if (props.type === 'example') {
      return `${props.parentId}/example/${slug(props.name)}`
    }

    if (props.type === 'document') {
      // -------- Default document id generation logic --------
      return documentId
    }

    console.warn('[WARNING]: unhandled id generation for navigation item:', props)
    return 'unknown-id'
  }

  return {
    hideModels: options?.hideModels ?? false,
    operationsSorter: options?.operationsSorter,
    tagsSorter: options?.tagsSorter,
    generateId,
  }
}
