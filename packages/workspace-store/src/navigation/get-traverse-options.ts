import { slug } from 'github-slugger'

import type { TraverseSpecOptions } from '@/navigation/types'
import type { DocumentConfiguration } from '@/schemas/workspace-specification/config'

export const getTraverseOptions = (config?: DocumentConfiguration): TraverseSpecOptions => {
  const referenceConfig = config?.['x-scalar-reference-config']

  /**
   * Generate a tag id
   */
  const getTagIdDefault: TraverseSpecOptions['getTagId'] = (tag) => {
    const generateTagSlug = referenceConfig?.generateTagSlug
    if (generateTagSlug) {
      return `tag/${generateTagSlug(tag)}`
    }
    return `tag/${slug(tag.name ?? '')}`
  }

  const getHeadingIdDefault: TraverseSpecOptions['getHeadingId'] = (heading) => {
    const generateHeadingSlug = referenceConfig?.generateHeadingSlug

    if (generateHeadingSlug) {
      return `${generateHeadingSlug(heading)}`
    }

    if (heading.slug) {
      return `description/${heading.slug}`
    }
    return ''
  }

  const getModelIdDefault: TraverseSpecOptions['getModelId'] = (model, parentTag) => {
    const generateModelSlug = referenceConfig?.generateModelSlug

    if (!model?.name) {
      return 'models'
    }

    /** Prefix with the tag if we have one */
    const prefixTag = parentTag ? `${getTagId(parentTag)}/` : ''

    if (generateModelSlug) {
      return `${prefixTag}model/${generateModelSlug(model)}`
    }
    return `${prefixTag}model/${slug(model.name)}`
  }

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

  const getWebhookIdDefault: TraverseSpecOptions['getWebhookId'] = (webhook, parentTag) => {
    const generateWebhookSlug = referenceConfig?.generateWebhookSlug

    if (!webhook?.name) {
      return 'webhooks'
    }

    /** Prefix with the tag if we have one */
    const prefixTag = parentTag ? `${getTagId(parentTag)}/` : ''

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
  const operationsSorter: TraverseSpecOptions['operationsSorter'] = referenceConfig?.operationsSorter ?? 'alpha'
  const tagsSorter: TraverseSpecOptions['tagsSorter'] = referenceConfig?.tagSort ?? 'alpha'

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
