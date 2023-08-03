<script setup lang="ts">
import prettyBytes from 'pretty-bytes'
import prettyMilliseconds from 'pretty-ms'
import { computed } from 'vue'

import httpStatusCodes from '../../../fixtures/httpStatusCodes.json'
import { useApiClientRequestStore } from '../../../stores/apiClientRequestStore'
import { type ClientResponse } from '../../../types'
import { CodeMirror } from '../../CodeMirror'
import { CollapsibleSection } from '../../CollapsibleSection'
// import Copilot from './Copilot.vue'
import { SimpleGrid } from '../../Grid'
import ResponseHeaders from './ResponseHeaders.vue'
import ResponsePreview from './ResponsePreview.vue'

const { activeResponse, activeRequestId } = useApiClientRequestStore()

// Size of the response
const getContentLength = (response: ClientResponse) => {
  if (response?.headers?.['X-API-Client-Content-Length']) {
    return prettyBytes(
      parseFloat(response.headers['X-API-Client-Content-Length']),
    )
  }
  return prettyBytes(0)
}

// Headers
const responseHeaders = computed(() => {
  const headers = activeResponse.value?.headers

  return headers
    ? Object.keys(headers)
        .map((key) => ({ name: key, value: headers[key] }))
        .filter(
          (item) =>
            ![
              'rest-api-client-content-length',
              'X-API-Client-Content-Length',
            ].includes(item.name),
        )
    : []
})

// Cookies
const responseCookies = computed(() => {
  const cookies = activeResponse.value?.cookies

  return cookies
    ? Object.keys(cookies).map((key) => ({ name: key, value: cookies[key] }))
    : []
})

// Check if string is JSON
const isJsonString = (value?: string) => {
  if (typeof value !== 'string') {
    return false
  }

  try {
    JSON.parse(value)
  } catch {
    return false
  }

  return true
}

// Pretty print JSON
const responseData = computed(() => {
  const value = activeResponse.value?.data

  if (value && isJsonString(value)) {
    return JSON.stringify(JSON.parse(value), null, 2)
  }

  return value
})

const statusText = computed(() => {
  const statusCode = activeResponse.value?.statusCode

  if (!statusCode) {
    return ''
  }

  return Object.hasOwnProperty.call(httpStatusCodes, statusCode)
    ? // @ts-ignore
      httpStatusCodes[statusCode]
    : null
})
</script>
<template>
  <div class="scalar-api-client__main__right custom-scroll">
    <div class="scalar-api-client__main__content">
      <label>Response</label>
      <div class="meta">
        <template v-if="activeRequestId && activeResponse">
          <div class="meta-item">
            <!-- <span>182 ms</span> -->
            <span>{{ prettyMilliseconds(activeResponse.duration) }}</span>
          </div>
          <div class="meta-item">
            <!-- <span>20 Bytes</span> -->
            <span>{{ getContentLength(activeResponse) }}</span>
          </div>
          <div class="meta-item">
            <!-- <span>200</span> -->
            <span
              :class="`scalar-api-client__status--${String(
                activeResponse.statusCode,
              ).charAt(0)}xx`">
              {{ activeResponse.statusCode }}
              {{ statusText.name }}
            </span>
          </div>
        </template>
        <template v-else>
          <div class="meta-item">
            <span>Send your first request to start</span>
          </div>
        </template>
      </div>
    </div>
    <div>
      <ResponsePreview
        :active="!!activeResponse"
        :data="responseData" />
      <!-- <CollapsibleSection title="Co Pilot">
        <Copilot />
        <template v-if="responseHeaders.length === 0">
          <pre>No headers</pre>
        </template>
      </CollapsibleSection> -->
      <ResponseHeaders :headers="responseHeaders" />
      <CollapsibleSection title="Cookies">
        <SimpleGrid
          v-show="responseCookies.length > 0"
          :items="responseCookies" />
        <template v-if="responseCookies.length === 0">
          <div class="scalar-api-client__empty-state">No Cookies</div>
        </template>
      </CollapsibleSection>
      <div class="scalar-api-client__main__scroll-container" />
    </div>
  </div>
</template>
<style>
.scalar-api-client__main__right {
  width: 50%;
  padding: 0 0 12px 12px;
}
@media screen and (max-width: 820px) {
  .scalar-api-client__main__right {
    width: 100%;
    border-right: none;
  }
}
.scalar-api-client__main__right :deep(.scalar-copilot__header-button) {
  position: absolute;
  top: 6px;
  right: 12px;
}
</style>
