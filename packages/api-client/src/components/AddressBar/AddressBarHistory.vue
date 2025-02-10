<script setup lang="ts">
import { formatMs } from '@/libs/formatters'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import {
  ScalarFloating,
  ScalarFloatingBackdrop,
  ScalarIcon,
} from '@scalar/components'
import type { RequestEvent } from '@scalar/oas-utils/entities/spec'
import { httpStatusCodes } from '@scalar/oas-utils/helpers'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import HttpMethod from '../HttpMethod/HttpMethod.vue'
import { getStatusCodeColor } from './httpStatusCodeColors'

defineProps<{
  /** The id of the target to use for the popover (e.g. address bar) */
  target: string
}>()

const { activeRequest } = useActiveEntities()
const { requestHistory, requestExampleMutators } = useWorkspace()

const router = useRouter()

const selectedRequest = ref(requestHistory[0])

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
  <Listbox
    v-slot="{ open }"
    v-model="selectedRequest">
    <ScalarFloating
      :offset="0"
      resize
      :target="target">
      <!-- History -->
      <ListboxButton
        v-if="history?.length"
        class="addressbar-history-button z-context-plus mr-1 rounded-lg p-1.5 text-c-3 focus:text-c-1">
        <ScalarIcon
          icon="History"
          size="sm"
          thickness="2.25" />
        <span class="sr-only">Request History</span>
      </ListboxButton>
      <!-- History shadow and placement-->
      <template
        v-if="open"
        #floating="{ width }">
        <!-- History Item -->
        <ListboxOptions
          class="address-bg-states border-t custom-scroll max-h-[inherit] p-0.75 grid grid-cols-[44px,1fr,repeat(3,auto)] items-center"
          :style="{ width }">
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
        <ScalarFloatingBackdrop
          class="-top-[--scalar-address-bar-height] rounded-lg" />
      </template>
    </ScalarFloating>
  </Listbox>
</template>
<style scoped>
.addressbar-history-button:hover {
  background: var(--scalar-background-3);
}
.addressbar-history-button:focus-within {
  background: var(--scalar-background-2);
}
.addressbar-bg-states:has(.cm-focused) .codemirror-bg-switcher {
  --scalar-background-1: var(--scalar-background-1);
}
.addressbar-bg-states {
  background: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
}
.addressbar-bg-states:has(.cm-focused) {
  background: var(--scalar-background-1);
  border-color: var(--scalar-border-color);
  outline: 1px solid var(--scalar-color-accent);
}
</style>
