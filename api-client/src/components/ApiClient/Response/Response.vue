<script setup lang="ts">
import prettyBytes from 'pretty-bytes'
import prettyMilliseconds from 'pretty-ms'
import { computed } from 'vue'

import { useApiClientRequestStore } from '../../../stores/apiClientRequestStore'
import { type ClientResponse } from '../../../types'
import { CodeMirror } from '../../CodeMirror'
import { CollapsibleSection } from '../../CollapsibleSection'
// import Copilot from './Copilot.vue'
import { SimpleGrid } from '../../Grid'

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
  const httpStatusCodes = {
    '100': 'Continue',
    '101': 'Switching Protocols',
    '102': 'Processing',
    '103': 'Early Hints',
    '200': 'OK',
    '201': 'Created',
    '202': 'Accepted',
    '203': 'Non-Authoritative Information',
    '204': 'No Content',
    '205': 'Reset Content',
    '206': 'Partial Content',
    '207': 'Multi-Status',
    '208': 'Already Reported',
    '226': 'IM Used',
    '300': 'Multiple Choices',
    '301': 'Moved Permanently',
    '302': 'Found',
    '303': 'See Other',
    '304': 'Not Modified',
    '305': 'Use Proxy',
    '306': '(Unused)',
    '307': 'Temporary Redirect',
    '308': 'Permanent Redirect',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '402': 'Payment Required',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '406': 'Not Acceptable',
    '407': 'Proxy Authentication Required',
    '408': 'Request Timeout',
    '409': 'Conflict',
    '410': 'Gone',
    '411': 'Length Required',
    '412': 'Precondition Failed',
    '413': 'Content Too Large',
    '414': 'URI Too Long',
    '415': 'Unsupported Media Type',
    '416': 'Range Not Satisfiable',
    '417': 'Expectation Failed',
    '421': 'Misdirected Request',
    '422': 'Unprocessable Content',
    '423': 'Locked',
    '424': 'Failed Dependency',
    '425': 'Too Early',
    '426': 'Upgrade Required',
    '428': 'Precondition Required',
    '429': 'Too Many Requests',
    '431': 'Request Header Fields Too Large',
    '451': 'Unavailable For Legal Reasons',
    '500': 'Internal Server Error',
    '501': 'Not Implemented',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
    '504': 'Gateway Timeout',
    '505': 'HTTP Version Not Supported',
    '506': 'Variant Also Negotiates',
    '507': 'Insufficient Storage',
    '508': 'Loop Detected',
    '510': 'Not Extended',
    '511': 'Network Authentication Required',
  }

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
              {{ statusText }}
            </span>
          </div>
        </template>
        <template v-else>
          <div class="meta-item">
            <span>Send Request to Start</span>
          </div>
        </template>
      </div>
    </div>
    <div>
      <CollapsibleSection title="Preview">
        <CodeMirror
          :content="activeResponse ? responseData : 'No response'"
          :readOnly="true" />
      </CollapsibleSection>
      <!-- <CollapsibleSection title="Co Pilot">
        <Copilot />
        <template v-if="responseHeaders.length === 0">
          <pre>No headers</pre>
        </template>
      </CollapsibleSection> -->
      <CollapsibleSection title="Headers">
        <SimpleGrid
          v-show="responseHeaders.length > 0"
          :items="responseHeaders" />
        <template v-if="responseHeaders.length === 0">
          <pre>No headers</pre>
        </template>
      </CollapsibleSection>
      <CollapsibleSection title="Cookies">
        <SimpleGrid
          v-show="responseCookies.length > 0"
          :items="responseCookies" />
        <template v-if="responseCookies.length === 0">
          <pre>No cookies</pre>
        </template>
      </CollapsibleSection>
      <div class="scalar-api-client__main__scroll-container" />
    </div>
  </div>
</template>
<style>
.scalar-api-client__main__right {
  width: 50%;
  height: 95vh;
  /* max-height: calc(100vh - 194px); */
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
