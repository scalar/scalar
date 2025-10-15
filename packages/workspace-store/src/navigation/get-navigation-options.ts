import { slug } from 'github-slugger'

import type { TraverseSpecOptions } from '@/navigation/types'
import type { DocumentConfiguration } from '@/schemas/workspace-specification/config'

/**
 * Returns options for traversing an OpenAPI document, allowing customization of
 * how IDs and slugs are generated for tags, headings, models, operations, and webhooks.
 * The returned options can be influenced by the provided DocumentConfiguration
 */
export const getNavigationOptions = (documentName: string, config?: DocumentConfiguration): TraverseSpecOptions => {
  const referenceConfig = config?.['x-scalar-reference-config']

  /**
   * Generate a tag id.
   * If a custom generateTagSlug function is provided in the referenceConfig, use it to generate the tag slug.
   * Otherwise, fall back to using the default slug function from 'github-slugger' on the tag name.
   */
  const getTagIdDefault: TraverseSpecOptions['getTagId'] = (tag) => {
    const generateTagSlug = referenceConfig?.generateTagSlug
    if (generateTagSlug) {
      return `${documentName}/tag/${generateTagSlug(tag)}`
    }
    return `${documentName}/tag/${slug(tag.name ?? '')}`
  }

  /**
   * Generate a heading id.
   * If a custom generateHeadingSlug function is provided in the referenceConfig, use it to generate the heading slug.
   * Otherwise, if the heading has a slug property, prefix it with 'description/'.
   * If neither is available, return an empty string.
   */
  const getHeadingIdDefault: TraverseSpecOptions['getHeadingId'] = (heading) => {
    const generateHeadingSlug = referenceConfig?.generateHeadingSlug

    if (generateHeadingSlug) {
      return `${documentName}/${generateHeadingSlug(heading)}`
    }

    if (heading.slug) {
      return `${documentName}/description/${heading.slug}`
    }
    return documentName
  }

  /**
   * Generate a model id.
   * If a custom generateModelSlug function is provided in the referenceConfig, use it to generate the model slug.
   * If the model does not have a name, return 'models'.
   * Otherwise, prefix with the tag (if provided) and use the default slug function from 'github-slugger' on the model name.
   */
  const getModelIdDefault: TraverseSpecOptions['getModelId'] = (model, parentTag) => {
    const generateModelSlug = referenceConfig?.generateModelSlug

    if (!model?.name) {
      return `${documentName}/models`
    }

    // Prefix with the tag if we have one
    const prefixTag = parentTag ? `${documentName}/${getTagId(parentTag)}/` : `${documentName}/`

    if (generateModelSlug) {
      return `${prefixTag}model/${generateModelSlug(model)}`
    }
    return `${prefixTag}model/${slug(model.name)}`
  }

  /**
   * Generate an operation id.
   * If a custom generateOperationSlug function is provided in the referenceConfig, use it to generate the operation slug.
   * Otherwise, use the default format: <tagId>/<method><path>
   */
  const getOperationIdDefault: TraverseSpecOptions['getOperationId'] = (operation, parentTag) => {
    const generateOperationSlug = referenceConfig?.generateOperationSlug
    if (generateOperationSlug) {
      return `${getTagId(parentTag)}/${generateOperationSlug({
        path: operation.path,
        operationId: operation.operationId,
        method: operation.method,
        summary: operation.summary,
      })}`
    }

    return `${getTagId(parentTag)}/${operation.method}${operation.path}`
  }

  /**
   * Generate a webhook id.
   * If a custom generateWebhookSlug function is provided in the referenceConfig, use it to generate the webhook slug.
   * If the webhook does not have a name, return 'webhooks'.
   * Otherwise, prefix with the tag (if provided) and use the default slug function from 'github-slugger' on the webhook name.
   */
  const getWebhookIdDefault: TraverseSpecOptions['getWebhookId'] = (webhook, parentTag) => {
    const generateWebhookSlug = referenceConfig?.generateWebhookSlug

    if (!webhook?.name) {
      return `${documentName}/webhooks`
    }

    // Prefix with the tag if we have one
    const prefixTag = parentTag ? `${getTagId(parentTag)}/` : `${documentName}/`

    if (generateWebhookSlug) {
      return `${prefixTag}webhook/${generateWebhookSlug(webhook)}`
    }
    return `${prefixTag}webhook/${webhook.method}/${slug(webhook.name)}`
  }

  const getHeadingId = referenceConfig?.getHeadingId ?? getHeadingIdDefault
  const getModelId = referenceConfig?.getModelId ?? getModelIdDefault
  const getOperationId = referenceConfig?.getOperationId ?? getOperationIdDefault
  const getWebhookId = referenceConfig?.getWebhookId ?? getWebhookIdDefault
  const getTagId = referenceConfig?.getTagId ?? getTagIdDefault

  const hideModels = referenceConfig?.features?.showModels === false
  const operationsSorter: TraverseSpecOptions['operationsSorter'] = referenceConfig?.operationsSorter
  const tagsSorter: TraverseSpecOptions['tagsSorter'] = referenceConfig?.tagSort

  return {
    hideModels,
    operationsSorter,
    tagsSorter,
    getHeadingId,
    getModelId,
    getOperationId,
    getWebhookId,
    getTagId,
  }
}
