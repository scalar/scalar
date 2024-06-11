<script lang="ts" setup>
import { type HttpStatusCode, httpStatusCodes } from '@scalar/oas-utils/helpers'
import prettyBytes from 'pretty-bytes'
import prettyMilliseconds from 'pretty-ms'
import { computed } from 'vue'

import type { ClientResponse } from '../../../types'
import HelpfulLink from '../../HelpfulLink.vue'

const props = defineProps<{ response: any }>()

/** Size of the response */
const getContentLength = (response: ClientResponse) => {
  const contentLength = parseInt(response.headers?.['content-length'], 10)

  return contentLength ? prettyBytes(contentLength) : undefined
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
  <div
    v-if="getContentLength(response)"
    class="meta-item">
    <!-- <span>20 Bytes</span> -->
    <span>{{ getContentLength(response) }}</span>
  </div>
  <div class="meta-item">
    <!-- <span>200</span> -->
    <span>
      <template v-if="response.statusCode">
        <template v-if="statusCodeInformation?.url">
          <HelpfulLink :href="statusCodeInformation.url">
            {{ response.statusCode }} {{ statusCodeInformation.name }}
          </HelpfulLink>
        </template>
        <template v-else>
          {{ response.statusCode }} {{ statusCodeInformation?.name }}
        </template>
      </template>
    </span>
  </div>
</template>
