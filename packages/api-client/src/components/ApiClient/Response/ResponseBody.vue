<script lang="ts" setup>
import { ScalarCodeBlock } from '@scalar/components'
import contentType from 'content-type'
import { computed } from 'vue'

import { CollapsibleSection } from '../../CollapsibleSection'

const props = withDefaults(
  defineProps<{
    active: boolean
    data: any
    headers: Record<string, string>[]
  }>(),
  {
    active: false,
    data: null,
  },
)

const mediaType = computed(() => {
  const contentTypeHeader = props.headers.find(
    (header) => header.name.toLowerCase() === 'content-type',
  )

  if (!contentTypeHeader) {
    return null
  }

  try {
    return contentType.parse(contentTypeHeader.value).type
  } catch {
    return null
  }
})

const codeMirrorLanguage = computed((): string | null => {
  if (
    mediaType.value === 'application/json' ||
    mediaType.value === 'application/problem+json' ||
    mediaType.value === 'application/vnd.api+json'
  ) {
    return 'json'
  }

  if (mediaType.value === 'text/html') {
    return 'html'
  }

  if (mediaType.value === 'text/plain') {
    return 'html'
  }

  return null
})
</script>
<template>
  <CollapsibleSection title="Body">
    <template v-if="active">
      <ScalarCodeBlock
        v-if="codeMirrorLanguage"
        class="custom-scroll"
        :content="data"
        :lang="codeMirrorLanguage" />
      <div
        v-else
        class="scalar-api-client__empty-state">
        <template v-if="mediaType">
          No Preview Available ({{ mediaType }})
        </template>
        <template v-else>
          Can’t render a preview. The Content-Type header is missing or unknown.
        </template>
      </div>
    </template>
    <div
      v-else
      class="scalar-api-client__empty-state">
      No Response
    </div>
  </CollapsibleSection>
</template>
