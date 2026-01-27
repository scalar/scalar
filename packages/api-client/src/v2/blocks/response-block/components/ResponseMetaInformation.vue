<script lang="ts" setup>
import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import { httpStatusCodes, type HttpStatusCode } from '@scalar/oas-utils/helpers'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import prettyMilliseconds from 'pretty-ms'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import HelpfulLink from '@/components/HelpfulLink.vue'
import { getContentLength } from '@/v2/blocks/response-block/helpers/get-content-length'

const { response, eventBus } = defineProps<{
  /** Response */
  response: ResponseInstance
  /** Workspace event bus */
  eventBus: WorkspaceEventBus
}>()

const interval = ref<ReturnType<typeof setInterval>>()
const stopwatch = ref(0)

const stopStopwatch = () => {
  clearInterval(interval.value)
  interval.value = undefined
  stopwatch.value = 0
}

const startStopwatch = () => {
  interval.value = setInterval(() => (stopwatch.value += 1000), 1000)
}

onMounted(() => {
  eventBus.on('hooks:on:request:sent', startStopwatch)
  eventBus.on('hooks:on:request:complete', stopStopwatch)
})

onBeforeUnmount(() => {
  eventBus.off('hooks:on:request:sent', startStopwatch)
  eventBus.off('hooks:on:request:complete', stopStopwatch)
  stopStopwatch()
})

/** Status text for the response */
const statusCodeInformation = computed((): HttpStatusCode | undefined => {
  const responseStatusCode = response?.status

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
