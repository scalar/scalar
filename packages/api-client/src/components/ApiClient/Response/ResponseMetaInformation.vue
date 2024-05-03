<script lang="ts" setup>
import prettyBytes from 'pretty-bytes'
import prettyMilliseconds from 'pretty-ms'
import { computed } from 'vue'

import { type HttpStatusCode, httpStatusCodes } from '../../../fixtures'
import type { ClientResponse } from '../../../types'
import HelpfulLink from '../../HelpfulLink.vue'

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
const statusCodeInformation = computed((): HttpStatusCode | undefined => {
  const responseStatusCode = props.response.statusCode

  if (!responseStatusCode) {
    return undefined
  }

  return httpStatusCodes[responseStatusCode] ?? undefined
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
      <template v-if="statusCodeInformation?.url">
        <HelpfulLink :href="statusCodeInformation.url">
          {{ response.statusCode }} {{ statusCodeInformation.name }}
        </HelpfulLink>
      </template>
      <template v-else>
        {{ response.statusCode }} {{ statusCodeInformation?.name }}
      </template>
    </span>
  </div>
</template>
<style>
.scalar-api-client__status--1xx:before,
.scalar-api-client__status--2xx:before,
.scalar-api-client__status--3xx:before,
.scalar-api-client__status--4xx:before,
.scalar-api-client__status--5xx:before,
.scalar-api-client__status--6xx:before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 4px;
  background: var(--scalar-background-2);
}
.scalar-api-client__status--2xx:before {
  background: var(--scalar-color-green);
}
.scalar-api-client__status--3xx:before {
  background: var(--scalar-color-orange);
}
.scalar-api-client__status--4xx:before {
  background: var(--scalar-color-red);
}
</style>
