<script lang="ts" setup>
import { CodeMirror, type CodeMirrorLanguage } from '@scalar/use-codemirror'
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

const codeMirrorLanguages = computed((): CodeMirrorLanguage[] | null => {
  if (mediaType.value === 'application/json') {
    return ['json']
  }

  if (mediaType.value === 'text/html') {
    return ['html']
  }

  return null
})
</script>
<template>
  <CollapsibleSection title="Body">
    <template v-if="active">
      <CodeMirror
        v-if="codeMirrorLanguages"
        :content="data"
        :languages="codeMirrorLanguages"
        readOnly />
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
