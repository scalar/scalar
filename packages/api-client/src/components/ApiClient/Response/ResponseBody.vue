<script lang="ts" setup>
import { ScalarCodeBlock } from '@scalar/components'
import { isJsonString, normalizeMimeType } from '@scalar/oas-utils/helpers'
import { computed, toRaw } from 'vue'

import { normalizeHeaders } from '../../../helpers'
import { CollapsibleSection } from '../../CollapsibleSection'

const props = defineProps<{
  response?: any
}>()

// In order to render the response body, we need to know the media type.
const mediaType = computed(() => {
  // Transform all header keys to lowercase
  const headers = normalizeHeaders(props.response?.headers)

  // Get the content-type header
  const contentTypeHeader = `${headers['content-type']}`

  if (!contentTypeHeader) {
    return null
  }

  // application/foobar+json; charset=utf-8 -> application/json
  return normalizeMimeType(contentTypeHeader)
})

// Determine the CodeMirror language based on the media type
const codeMirrorLanguage = computed((): string | undefined => {
  if (mediaType.value === 'application/json') {
    return 'json'
  }

  if (mediaType.value === 'text/html') {
    return 'html'
  }

  if (mediaType.value === 'text/plain') {
    return 'html'
  }

  // let's just always return html vs not rendering anything
  return 'html'
})

// Pretty print JSON
const formattedResponseData = computed(() => {
  const value = props.response?.data

  // Format JSON
  if (value && isJsonString(value)) {
    return JSON.stringify(JSON.parse(value as string), null, 2)
  } else if (value && typeof toRaw(value) === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return value
})
</script>
<template>
  <CollapsibleSection title="Body">
    <template v-if="response">
      <ScalarCodeBlock
        v-if="codeMirrorLanguage || typeof response.data === 'string'"
        class="custom-scroll"
        :content="formattedResponseData || response?.error?.message"
        :lang="codeMirrorLanguage" />
      <div
        v-else
        class="scalar-api-client__empty-state">
        <template v-if="mediaType">
          No preview available for {{ mediaType }}
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
