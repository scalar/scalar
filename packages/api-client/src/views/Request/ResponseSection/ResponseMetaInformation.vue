<script lang="ts" setup>
import HelpfulLink from '@/components/HelpfulLink.vue'
import { useWorkspace } from '@/store'
import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import { type HttpStatusCode, httpStatusCodes } from '@scalar/oas-utils/helpers'
import prettyBytes from 'pretty-bytes'
import prettyMilliseconds from 'pretty-ms'
import { computed, ref } from 'vue'

const props = defineProps<{ response: ResponseInstance }>()

const { events } = useWorkspace()
const interval = ref<ReturnType<typeof setInterval>>()
const stopwatch = ref(0)

events.requestStatus.on((status) => {
  if (status === 'start')
    interval.value = setInterval(() => (stopwatch.value += 1000), 1000)
  else
    clearInterval(interval.value),
      (interval.value = undefined),
      (stopwatch.value = 0)
})

/** Size of the response */
const getContentLength = (response: ResponseInstance) => {
  const contentLength = parseInt(
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
  <div class="flex gap-1.5 text-c-3 pl-1">
    <span v-if="interval && stopwatch">{{
      prettyMilliseconds(stopwatch)
    }}</span>
    <template v-else>
      <span>{{ prettyMilliseconds(response.duration) }}</span>
      <span v-if="getContentLength(response)">{{
        getContentLength(response)
      }}</span>
      <template v-if="statusCodeInformation">
        <HelpfulLink
          v-if="statusCodeInformation.url"
          :href="statusCodeInformation.url">
          {{ response.status }} {{ statusCodeInformation.name }}
        </HelpfulLink>
        <span v-else>
          {{ response.status }} {{ statusCodeInformation.name }}
        </span>
      </template>
    </template>
  </div>
</template>
