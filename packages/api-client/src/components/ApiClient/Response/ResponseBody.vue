<script lang="ts" setup>
import { CodeMirror } from '@scalar/use-codemirror'
import contentType from 'content-type'
import { computed } from 'vue'

import type { CodeMirrorLanguage } from '../../../types'
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

const codeMirrorLanguages = computed((): CodeMirrorLanguage[] => {
  const contentTypeHeader = props.headers.find(
    (header) => header.name.toLowerCase() === 'content-type',
  )

  if (!contentTypeHeader) {
    return []
  }

  const type = contentType.parse(contentTypeHeader?.value).type

  if (type === 'application/json') {
    return ['json']
  }

  if (type === 'text/html') {
    return ['html']
  }

  return []
})
</script>
<template>
  <CollapsibleSection title="Body">
    <CodeMirror
      v-if="active"
      :content="data"
      :languages="codeMirrorLanguages"
      readOnly />
    <div
      v-else
      class="scalar-api-client__empty-state">
      No Response
    </div>
  </CollapsibleSection>
</template>
