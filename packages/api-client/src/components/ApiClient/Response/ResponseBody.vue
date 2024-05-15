<script lang="ts" setup>
import { ScalarCodeBlock } from '@scalar/components'
import { isJsonString, normalizeMimeType } from '@scalar/oas-utils'
import type { AxiosHeaders } from 'axios'
import { computed, toRaw } from 'vue'

import { CollapsibleSection } from '../../CollapsibleSection'

const props = defineProps<{
  response?: any
}>()

// In order to render the response body, we need to know the media type.
const mediaType = computed(() => {
  // Transform all header keys to lowercase
  const headers = Object.fromEntries(
    Object.entries(props.response.headers as AxiosHeaders).map(
      ([key, value]) => [key.toLowerCase(), value],
    ),
  )

  // Get the content-type header
  const contentTypeHeader = headers['content-type']

  if (!contentTypeHeader) {
    return null
  }

  // application/foobar+json; charset=utf-8 -> application/json
  return normalizeMimeType(contentTypeHeader?.value)
})

// Determine the CodeMirror language based on the media type
const codeMirrorLanguage = computed((): string | null => {
  if (mediaType.value === 'application/json') {
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
  <!-- <div
    v-if="response.error"
    class="error-message">
    {{ response.error.message }}
  </div> -->
  <CollapsibleSection title="Body">
    <template v-if="response">
      <ScalarCodeBlock
        v-if="codeMirrorLanguage"
        class="custom-scroll"
        :content="formattedResponseData"
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

<!-- <style scoped>
.error-message {
  padding: 10px;
  width: 100%;
  color: var(--scalar-color-red);
  border-top: none;
  font-size: var(--scalar-small);
}
</style> -->
