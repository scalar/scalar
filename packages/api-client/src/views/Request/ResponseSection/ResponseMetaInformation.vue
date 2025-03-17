<script lang="ts" setup>
import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import { httpStatusCodes, type HttpStatusCode } from '@scalar/oas-utils/helpers'
import prettyBytes from 'pretty-bytes'
import prettyMilliseconds from 'pretty-ms'
import { computed, ref } from 'vue'

import HelpfulLink from '@/components/HelpfulLink.vue'
import { useWorkspace } from '@/store'

const props = defineProps<{ response: ResponseInstance }>()

const { events } = useWorkspace()
const interval = ref<ReturnType<typeof setInterval>>()
const stopwatch = ref(0)

events.requestStatus.on((status) => {
  if (status === 'start') {
    interval.value = setInterval(() => (stopwatch.value += 1000), 1000)
  } else {
    clearInterval(interval.value),
      (interval.value = undefined),
      (stopwatch.value = 0)
  }
})

/** Size of the response */
const getContentLength = (response: ResponseInstance) => {
  const contentLength = Number.parseInt(
    response.headers?.['Content-Length'] ||
      response.headers?.['content-length'] ||
      '0',
    10,
  )

  return contentLength ? prettyBytes(contentLength) : undefined
}

/** Status text for the response */
const statusCodeInformation = computed((): HttpStatusCode | undefined => {
  const responseStatusCode = props.response.status

  if (!responseStatusCode) {
    return undefined
  }

  return httpStatusCodes[responseStatusCode] ?? undefined
})
</script>
<template>
  <div class="text-c-1 flex gap-1.5">
    <span v-if="interval && stopwatch">{{
      prettyMilliseconds(stopwatch)
    }}</span>
    <template v-else>
      <span>
        <span class="sr-only">Response Information, Duration:</span>
        {{ prettyMilliseconds(response.duration) }}
      </span>
      <span v-if="getContentLength(response)">
        <span class="sr-only">, Size:</span>
        {{ getContentLength(response) }}
      </span>
      <template v-if="statusCodeInformation">
        <span class="sr-only">, Status:</span>
        <HelpfulLink
          v-if="statusCodeInformation.url"
          class="flex items-center gap-1.5"
          :href="statusCodeInformation.url">
          {{ response.status }} {{ statusCodeInformation.name }}
          <span
            class="block h-1.5 w-1.5 rounded-full"
            :style="{ backgroundColor: statusCodeInformation.color }" />
        </HelpfulLink>
        <span v-else>
          {{ response.status }} {{ statusCodeInformation.name }}
          <span
            class="block h-1.5 w-1.5 rounded-full"
            :style="{ backgroundColor: statusCodeInformation.color }" />
        </span>
      </template>
    </template>
  </div>
</template>
