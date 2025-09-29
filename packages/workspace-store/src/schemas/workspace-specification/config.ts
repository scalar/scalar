import { Type } from '@scalar/typebox'
import type { PartialDeep } from 'type-fest'

import type { TraverseSpecOptions } from '@/navigation/types'
import { type ReferenceConfig, ReferenceConfigSchema } from '@/schemas/reference-config'

export const ConfigSchema = Type.Partial(
  Type.Object({
    'x-scalar-reference-config': ReferenceConfigSchema,
  }),
)

export type Config = {
  'x-scalar-reference-config'?: PartialDeep<ReferenceConfig>
}

export type DocumentConfiguration = Config &
  PartialDeep<{
    'x-scalar-reference-config': {
      tagSort: TraverseSpecOptions['tagsSorter']
      operationsSorter: TraverseSpecOptions['operationsSorter']
      getHeadingId: TraverseSpecOptions['getHeadingId']
      getOperationId: TraverseSpecOptions['getOperationId']
      getWebhookId: TraverseSpecOptions['getWebhookId']
      getModelId: TraverseSpecOptions['getModelId']
      getTagId: TraverseSpecOptions['getTagId']
      generateOperationSlug?: (details: {
        path: string
        operationId?: string
        method: string
        summary?: string
      }) => string
      generateHeadingSlug?: (details: { slug?: string }) => string
      generateTagSlug?: (details: { name?: string }) => string
      generateModelSlug?: (details: { name?: string }) => string
      generateWebhookSlug?: (details: { name: string; method?: string }) => string
    }
  }>
