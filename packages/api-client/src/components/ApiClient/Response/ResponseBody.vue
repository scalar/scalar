<script lang="ts" setup>
import { CodeMirror, type CodeMirrorLanguage } from '@scalar/use-codemirror'
import contentType from 'content-type'
import { computed, toRaw } from 'vue'

import { isJsonString } from '../../../helpers'
import { CollapsibleSection } from '../../CollapsibleSection'

const props = defineProps<{
  active?: boolean
  data?: Blob | string
  headers: Record<string, string>[]
}>()

const isBlob = (d: Blob | string): d is Blob => {
  return (d as Blob).type !== undefined
}

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

const formattedStringResponse = computed<string | undefined>(() => {
  if (!props.data || isBlob(props.data)) return undefined

  if (isJsonString(props.data)) {
    // Format JSON
    return JSON.stringify(JSON.parse(props.data as string), null, 2)
  } else if (typeof toRaw(props.data) === 'object') {
    return JSON.stringify(props.data, null, 2)
  }
  if (!isJsonString(props.data)) {
    return JSON.stringify(props.data, null, 2)
  }

  return props.data
})

const codeMirrorLanguages = computed((): CodeMirrorLanguage[] | null => {
  if (mediaType.value === 'application/json') {
    return ['json']
  }

  if (mediaType.value === 'text/html') {
    return ['html']
  }

  if (mediaType.value === 'text/plain') {
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
        :content="formattedStringResponse"
        :languages="codeMirrorLanguages"
        readOnly />
      <div
        v-else-if="data && isBlob(data)"
        class="scalar-api-client__empty-state">
        It's a blob! ({{ mediaType }})
      </div>
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
