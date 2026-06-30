import { slugify } from '@scalar/helpers/string/slugify'
import { type ApiReferenceConfigurationRaw, DEFAULT_MODELS_SECTION_LABEL } from '@scalar/types/api-reference'

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
        | 'modelsSectionLabel'
        | 'operationTitleSource'
      >
    >
  | undefined

/**
 * Returns options for traversing an OpenAPI document, allowing customization of
 * how IDs and slugs are generated for tags, headings, models, operations, and webhooks.
 * The returned options can be influenced by the provided DocumentConfiguration
 */
export const getNavigationOptions = (documentName: string, options?: NavigationOptions): TraverseSpecOptions => {
  const modelsSectionLabel = options?.modelsSectionLabel ?? DEFAULT_MODELS_SECTION_LABEL
  const modelsSectionSlug = slugify(modelsSectionLabel)

  const generateId: IdGenerator = (props) => {
    const documentId = slugify(documentName)

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
      // x-tagGroups wrapper nodes use `tag-group/…` IDs so they never share an ID
      // with a real tag that has the same display name. Native OpenAPI 3.2 nested
      // tags are real, uniquely-named tags, so they keep the regular `tag` prefix
      // regardless of whether they act as a section (`isGroup`). This keeps their
      // anchors stable even when a tag gains or loses operations of its own.
      const tagPrefix = props.isTagGroup ? 'tag-group' : 'tag'
      if (options?.generateTagSlug) {
        return `${documentId}/${tagPrefix}/${options.generateTagSlug(props.tag)}`
      }

      return `${documentId}/${tagPrefix}/${slugify(props.tag.name ?? '')}`
    }

    // -------- Default AsyncAPI channel id generation logic --------
    if (props.type === 'asyncapi-channel') {
      const prefixTag = props.parentTag
        ? `${generateId({
            type: 'tag',
            tag: props.parentTag.tag,
            parentId: props.parentTag.id,
          })}/`
        : `${documentId}/`

      return `${prefixTag}asyncapi-channel/${slugify(props.channelName)}`
    }

    // -------- Default AsyncAPI message id generation logic --------
    if (props.type === 'asyncapi-message') {
      return `${props.parentId}/asyncapi-message/${slugify(props.messageName)}`
    }

    // -------- Default AsyncAPI operation id generation logic --------
    if (props.type === 'asyncapi-operation') {
      return `${props.parentId}/asyncapi-operation/${slugify(props.operationName)}`
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

      return `${prefixTag}webhook/${props.method?.toUpperCase()}/${slugify(props.name)}`
    }

    // -------- Default model id generation logic --------
    if (props.type === 'model') {
      if (!props.name) {
        return `${documentId}/${modelsSectionSlug}`
      }

      const prefixTag = props.parentTag
        ? `${generateId({
            type: 'tag',
            parentId: props.parentTag.id,
            tag: props.parentTag.tag,
          })}/`
        : `${documentId}/`

      if (options?.generateModelSlug) {
        return `${prefixTag}${modelsSectionSlug}/${options.generateModelSlug({
          name: props.name,
        })}`
      }

      return `${prefixTag}${modelsSectionSlug}/${slugify(props.name, { preserveCase: true })}`
    }

    if (props.type === 'example') {
      return `${props.parentId}/example/${slugify(props.name)}`
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
    modelsSectionLabel,
    operationsSorter: options?.operationsSorter,
    tagsSorter: options?.tagsSorter,
    operationTitleSource: options?.operationTitleSource,
    generateId,
  }
}
