<script setup lang="ts">
import type {
  AsyncApiExternalDocumentationObject,
  AsyncApiTagsObject,
} from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ExternalDocumentationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'
import { ExternalDocs } from '@/features/external-docs'
import { useLocalization } from '@/features/localization'

const { tags, externalDocs } = defineProps<{
  /** Tag list from a channel, operation, or message. Entries may be `$ref`s. */
  tags?: AsyncApiTagsObject
  /** External documentation, possibly a `$ref`. */
  externalDocs?: unknown
}>()

const { translate } = useLocalization()

/** Resolved tags, dropping entries that don't carry a name. */
const resolvedTags = computed(() =>
  (tags ?? [])
    .map((tag) => getResolvedRef(tag))
    .filter((tag): tag is { name: string; description?: string } =>
      Boolean(tag?.name),
    ),
)

/**
 * External docs share the OpenAPI `{ url, description }` shape, so resolve any `$ref` and hand the
 * value to the shared `ExternalDocs` renderer.
 */
const resolvedExternalDocs = computed<ExternalDocumentationObject | undefined>(
  () => {
    const resolved = getResolvedRef(externalDocs) as
      | AsyncApiExternalDocumentationObject
      | undefined
    return resolved?.url ? (resolved as ExternalDocumentationObject) : undefined
  },
)

const hasContent = computed(
  () => resolvedTags.value.length > 0 || Boolean(resolvedExternalDocs.value),
)
</script>

<template>
  <div
    v-if="hasContent"
    class="async-api-tags">
    <template v-if="resolvedTags.length">
      <span class="sr-only">{{ translate('asyncapi.tags') }}:</span>
      <Badge
        v-for="tag in resolvedTags"
        :key="tag.name"
        :title="tag.description">
        {{ tag.name }}
      </Badge>
    </template>
    <ExternalDocs
      v-if="resolvedExternalDocs"
      :value="resolvedExternalDocs" />
  </div>
</template>

<style scoped>
.async-api-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}
</style>
