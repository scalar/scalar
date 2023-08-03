<script lang="ts" setup>
import prettyBytes from 'pretty-bytes'
import prettyMilliseconds from 'pretty-ms'
import { computed } from 'vue'

import httpStatusCodes from '../../../fixtures/httpStatusCodes.json'
import { type ClientResponse } from '../../../types'

const props = defineProps<{ response: any }>()

/** Size of the response */
const getContentLength = (response: ClientResponse) => {
  if (response?.headers?.['X-API-Client-Content-Length']) {
    return prettyBytes(
      parseFloat(response.headers['X-API-Client-Content-Length']),
    )
  }
  return prettyBytes(0)
}

/** Status text for the response */
const statusText = computed(() => {
  const statusCode = props.response.statusCode

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
  <div class="meta-item">
    <!-- <span>182 ms</span> -->
    <span>{{ prettyMilliseconds(response.duration) }}</span>
  </div>
  <div class="meta-item">
    <!-- <span>20 Bytes</span> -->
    <span>{{ getContentLength(response) }}</span>
  </div>
  <div class="meta-item">
    <!-- <span>200</span> -->
    <span
      :class="`scalar-api-client__status scalar-api-client__status--${String(
        response.statusCode,
      ).charAt(0)}xx`">
      <template v-if="statusText.url">
        <a
          :href="statusText.url"
          rel="noopener noreferrer"
          target="_blank">
          {{ response.statusCode }} {{ statusText.name }}
        </a>
      </template>
      <template v-else>
        {{ response.statusCode }} {{ statusText.name }}
      </template>
    </span>
  </div>
</template>

<style>
.scalar-api-client__status a {
  cursor: help;
}

.scalar-api-client__status a:hover {
  text-decoration: dashed underline;
}
</style>
