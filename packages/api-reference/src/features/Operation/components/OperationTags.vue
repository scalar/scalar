<script setup lang="ts">
import { getTagKind } from '@scalar/workspace-store/helpers/get-tag-kind'
import { isHidden } from '@scalar/workspace-store/helpers/is-hidden'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'
import { useLocalization } from '@/features/localization'

const { document, tags } = defineProps<{
  document?: OpenApiDocument
  tags?: string[]
}>()

const { translate } = useLocalization()

const labels = computed(() => {
  if (!document) {
    return []
  }
  const declaredTags = new Map(document.tags?.map((tag) => [tag.name, tag]))
  return Array.from(new Set(tags)).flatMap((name) => {
    const tag = declaredTags.get(name)
    const kind = getTagKind(document, tag)
    if (!tag || isHidden(tag) || kind === 'nav') {
      return []
    }
    const label = tag['x-displayName'] ?? tag.summary ?? tag.name
    return [
      {
        name,
        label:
          kind === 'audience'
            ? `${translate('operation.audience')}: ${label}`
            : label,
      },
    ]
  })
})
</script>

<template>
  <Badge
    v-for="tag in labels"
    :key="tag.name">
    {{ tag.label }}
  </Badge>
</template>
