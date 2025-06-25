<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import {
  ScalarFloating,
  ScalarFloatingBackdrop,
  ScalarIcon,
} from '@scalar/components'
import type { Operation, RequestEvent } from '@scalar/oas-utils/entities/spec'
import { httpStatusCodes } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

import { formatMs } from '@/libs/formatters'
import { useWorkspace } from '@/store'

import HttpMethod from '../HttpMethod/HttpMethod.vue'
import { getStatusCodeColor } from './httpStatusCodeColors'

const { operation, target } = defineProps<{
  operation: Operation
  /** The id of the target to use for the popover (e.g. address bar) */
  target: string
}>()

const { requestHistory } = useWorkspace()

/** Use a local copy to prevent mutation of the reactive object */
const history = computed(() =>
  requestHistory
    .filter((entry) => entry.request.requestUid === operation.uid)
    .slice()
    .reverse(),
)

function handleHistoryClick(requestHistoryItem: RequestEvent) {
  console.warn(
    "Restoring from the request history doesn't work yet. Request History Item:",
    requestHistoryItem,
  )
  // TODO: Restore the request data with the history item
  // TODO: Restore the response data with the history item
}
</script>
<template>
  <Menu
    v-slot="{ open }"
    as="div">
    <ScalarFloating
      :offset="0"
      resize
      :target="target">
      <!-- History -->
      <MenuButton
        v-if="history?.length"
        class="address-bar-history-button z-context-plus text-c-3 focus:text-c-1 relative mr-1 rounded-lg p-1.5">
        <ScalarIcon
          icon="History"
          size="sm"
          thickness="2.25" />
        <span class="sr-only">Request History</span>
      </MenuButton>
      <!-- History shadow and placement-->
      <template
        v-if="open"
        #floating="{ width }">
        <!-- History Item -->
        <MenuItems
          class="custom-scroll grid max-h-[inherit] grid-cols-[44px_1fr_repeat(3,auto)] items-center border-t p-0.75"
          static
          :style="{ width }">
          <MenuItem
            v-for="(entry, index) in history"
            :key="entry.timestamp"
            as="button"
            class="font-code ui-active:*:bg-b-2 text-c-2 contents text-sm font-medium *:flex *:h-8 *:cursor-pointer *:items-center *:rounded-none *:px-1.5 *:first:rounded-l *:last:rounded-r"
            :value="index"
            @click="handleHistoryClick(entry)">
            <HttpMethod
              v-if="entry.response.method"
              class="text-[11px]"
              :method="entry.response.method" />
            <div class="min-w-0">
              <div class="text-c-1 min-w-0 truncate">
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
          </MenuItem>
        </MenuItems>
        <ScalarFloatingBackdrop
          class="-top-(--scalar-address-bar-height) rounded-lg" />
      </template>
    </ScalarFloating>
  </Menu>
</template>
<style scoped>
.address-bar-history-button:hover {
  background: var(--scalar-background-3);
}
.address-bar-history-button:focus-within {
  background: var(--scalar-background-2);
}
</style>
