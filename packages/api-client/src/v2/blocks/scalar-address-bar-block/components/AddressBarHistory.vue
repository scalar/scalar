<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import {
  ScalarFloating,
  ScalarFloatingBackdrop,
  ScalarIcon,
} from '@scalar/components'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { httpStatusCodes } from '@scalar/oas-utils/helpers'

import { HttpMethod } from '@/components/HttpMethod'
import { formatMs } from '@/libs/formatters'

import { getStatusCodeColor } from './httpStatusCodeColors'

export type History = {
  id: string
  method: HttpMethodType
  path: string
  duration: number
  status: number
}

const { target } = defineProps<{
  /** The id of the target to use for the popover (e.g. address bar) */
  target: string
  /** List of all request history items */
  history: History[]
}>()

const emits = defineEmits<{
  /** Select a request history item by index */
  (e: 'selectHistoryItem', payload: { index: number }): void
}>()
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
        v-if="history.length"
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
            :key="entry.id"
            as="button"
            class="font-code ui-active:*:bg-b-2 text-c-2 contents text-sm font-medium *:flex *:h-8 *:cursor-pointer *:items-center *:rounded-none *:px-1.5 *:first:rounded-l *:last:rounded-r"
            :value="index"
            @click="emits('selectHistoryItem', { index })">
            <HttpMethod
              class="text-[11px]"
              :method="entry.method" />
            <div class="min-w-0">
              <div class="text-c-1 min-w-0 truncate">
                {{ entry.path }}
              </div>
            </div>
            <div>{{ formatMs(entry.duration) }}</div>
            <div :class="[getStatusCodeColor(entry.status).color]">
              {{ entry.status }}
            </div>
            <div>
              {{ httpStatusCodes[entry.status]?.name }}
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
