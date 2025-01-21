<script setup lang="ts">
import { formatMs } from '@/libs/formatters'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import type { RequestEvent } from '@scalar/oas-utils/entities/spec'
import { httpStatusCodes } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import HttpMethod from '../HttpMethod/HttpMethod.vue'
import { getStatusCodeColor } from './httpStatusCodeColors'

defineProps<{
  open: boolean
}>()

const { activeRequest } = useActiveEntities()
const { requestHistory, requestExampleMutators } = useWorkspace()

const router = useRouter()

/** Use a local copy to prevent mutation of the reactive object */
const history = computed(() =>
  requestHistory
    .filter((entry) => entry.request.requestUid === activeRequest.value?.uid)
    .slice()
    .reverse(),
)

// To be added back in later according to url management

// /** Generate a user readable URL */
// function getPrettyResponseUrl(rawUrl: string) {
//   const url = new URL(rawUrl)
//   const params = new URLSearchParams(url.search)

//   const scalarUrl = params.get('scalar_url')
//   if (!scalarUrl) return url.href

//   const scalarUrlParsed = new URL(scalarUrl)

//   return scalarUrlParsed.href
// }

function handleHistoryClick(historicalRequest: RequestEvent) {
  const workspaceId = router.currentRoute.value.params.workspace

  // see if we need to update the topnav
  // todo potentially search and find a previous open request id of this maybe
  // or we can open it in a draft state if the request is already open :)
  if (activeRequest.value?.uid !== historicalRequest.request.requestUid) {
    router.push(
      `/workspace/${workspaceId}/request/${historicalRequest.request.requestUid}`,
    )
  }
  requestExampleMutators.set({ ...historicalRequest.request })
}
</script>
<template>
  <!-- History -->
  <ListboxButton
    v-if="history?.length"
    class="addressbar-history-button mr-1 rounded-lg p-1.5 text-c-3 focus:text-c-1">
    <ScalarIcon
      icon="History"
      size="sm"
      thickness="2.25" />
  </ListboxButton>

  <!-- History shadow and placement-->
  <div
    :class="[
      'absolute bg-white left-0 top-8 w-full rounded-lg before:pointer-events-none before:absolute before:left-0 before:-top-8 before:h-[calc(100%+32px)] before:w-full before:rounded-lg z-context',
      { 'before:shadow-lg': open },
    ]">
    <!-- History Item -->
    <ListboxOptions
      class="bg-b-1 border-t custom-scroll max-h-[300px] rounded-b-lg p-[3px] grid grid-cols-[44px,1fr,repeat(3,auto)] items-center">
      <ListboxOption
        v-for="(entry, index) in history"
        :key="entry.timestamp"
        class="contents font-code text-sm *:rounded-none first:*:rounded-l last:*:rounded-r *:h-8 *:ui-active:bg-b-2 *:flex *:items-center *:cursor-pointer *:px-1.5 text-c-2 font-medium"
        :value="index"
        @click="handleHistoryClick(entry)">
        <HttpMethod
          v-if="entry.response.method"
          class="text-[11px]"
          :method="entry.response.method" />
        <div class="min-w-0">
          <div class="min-w-0 truncate text-c-1">
            {{ entry.response.path }}
          </div>
        </div>
        <div>{{ formatMs(entry.response.duration) }}</div>
        <div :class="[getStatusCodeColor(entry.response.status).color]">
          {{ entry.response.status }}
        </div>
        <div>
          {{ httpStatusCodes[entry.response.status]?.name }}
        </div>
      </ListboxOption>
    </ListboxOptions>
  </div>
</template>
<style scoped>
.addressbar-history-button:hover {
  background: var(--scalar-background-3);
}
.addressbar-history-button:focus-within {
  background: var(--scalar-background-2);
}
</style>
