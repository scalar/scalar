import { slug } from 'github-slugger'

import type { TraverseSpecOptions } from '@/navigation/types'
import type { IdGenerator } from '@/schemas/navigation'
import type { DocumentConfiguration } from '@/schemas/workspace-specification/config'

/**
 * Returns options for traversing an OpenAPI document, allowing customization of
 * how IDs and slugs are generated for tags, headings, models, operations, and webhooks.
 * The returned options can be influenced by the provided DocumentConfiguration
 */
export const getNavigationOptions = (documentName: string, config?: DocumentConfiguration): TraverseSpecOptions => {
  const referenceConfig = config?.['x-scalar-reference-config']

  const generateId: IdGenerator = (props) => {
    const documentId = `${slug(documentName)}`

    // -------- Default text id generation logic --------
    if (props.type === 'text') {
      if (referenceConfig?.generateHeadingSlug) {
        return referenceConfig?.generateHeadingSlug({ slug: props.slug })
      }

      if (props.slug) {
        return `${documentId}/description/${props.slug}`
      }

      return `${documentId}/`
    }

    // -------- Default tag id generation logic --------
    if (props.type === 'tag') {
      if (referenceConfig?.generateTagSlug) {
        return `${documentId}/tag/${referenceConfig.generateTagSlug(props.tag)}`
      }

      return `${documentId}/tag/${slug(props.tag.name ?? '')}`
    }

    // -------- Default operation id generation logic --------
    if (props.type === 'operation') {
      const tagId = `${generateId({
        type: 'tag',
        tag: props.parentTag.tag,
        parentId: props.parentTag.id,
      })}`

      if (referenceConfig?.generateOperationSlug) {
        return `${tagId}/${referenceConfig.generateOperationSlug({
          path: props.path,
          operationId: props.operation.operationId,
          method: props.method,
          summary: props.operation.summary,
        })}`
      }

      return `${tagId}/${props.method}${props.path}`
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

      if (referenceConfig?.generateWebhookSlug) {
        return `${prefixTag}webhook/${referenceConfig.generateWebhookSlug({
          name: props.name,
          method: props.method,
        })}`
      }

      return `${prefixTag}webhook/${props.method}/${slug(props.name)}`
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

      if (referenceConfig?.generateModelSlug) {
        return `${prefixTag}model/${referenceConfig.generateModelSlug({
          name: props.name,
        })}`
      }

      return `${prefixTag}model/${slug(props.name)}`
    }

    // -------- Default parameter id generation logic --------
    if (props.type === 'parameter') {
      return `${props.parentId}/parameter/${slug(props.parameter.name ?? '')}`
    }

    // -------- Default body parameter id generation logic --------
    if (props.type === 'body') {
      return `${props.parentId}/body/${slug(props.name)}`
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

  const hideModels = referenceConfig?.features?.showModels === false
  const operationsSorter: TraverseSpecOptions['operationsSorter'] = referenceConfig?.operationsSorter
  const tagsSorter: TraverseSpecOptions['tagsSorter'] = referenceConfig?.tagSort

  return {
    hideModels,
    operationsSorter,
    tagsSorter,
    generateId,
  }
}
