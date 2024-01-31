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

const title = computed<string>(() => {
  if (!props.data || !isBlob(props.data)) return 'Body'
  return 'Body (Blob)'
})

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

const blobDownloadHref = computed<string | undefined>(() => {
  if (!props.data || !isBlob(props.data)) return undefined
  return URL.createObjectURL(props.data)
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
  <CollapsibleSection :title="title">
    <template v-if="active">
      <CodeMirror
        v-if="codeMirrorLanguages"
        :content="formattedStringResponse"
        :languages="codeMirrorLanguages"
        readOnly />
      <div
        v-else-if="data && isBlob(data)"
        class="scalar-api-client__empty-state">
        <a
          class="scalar-api-client-add"
          :href="blobDownloadHref">
          <svg
            class="flow-icon"
            height="100%"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <g>
              <path
                d="M22.67 16.94a1.22 1.22 0 0 0 -1.22 1.21V20a1.57 1.57 0 0 1 -1.57 1.57H4.12A1.57 1.57 0 0 1 2.55 20v-1.85a1.22 1.22 0 0 0 -2.43 0V20a4 4 0 0 0 4 4h15.76a4 4 0 0 0 4 -4v-1.85a1.21 1.21 0 0 0 -1.21 -1.21Z"
                fill="currentcolor"
                stroke-width="1"></path>
              <path
                d="M12 0a1.94 1.94 0 0 0 -1.94 1.94V11a0.25 0.25 0 0 1 -0.25 0.25H7.15a1 1 0 0 0 -0.73 1.6l4.85 5.58a1 1 0 0 0 1.46 0l4.85 -5.58a1 1 0 0 0 -0.73 -1.6h-2.66a0.25 0.25 0 0 1 -0.25 -0.25V1.94A1.94 1.94 0 0 0 12 0Z"
                fill="currentcolor"
                stroke-width="1"></path>
            </g>
          </svg>
          Download File
        </a>
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
