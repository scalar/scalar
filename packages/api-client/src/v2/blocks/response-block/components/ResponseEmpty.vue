<script setup lang="ts">
import { ScalarHotkey } from '@scalar/components'
import { onBeforeUnmount, onMounted } from 'vue'

import Computer from '@/assets/computer.ascii?raw'
import EmptyState from '@/components/EmptyState.vue'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import { type ClientLayout } from '@/hooks'
import type { HotKeyEvent } from '@/libs'
import type { createStoreEvents } from '@/store/events'

const { totalPerformedRequests, layout, appVersion, events } = defineProps<{
  /** Client layout */
  layout: ClientLayout
  /** Total number of performed requests */
  totalPerformedRequests: number
  /** Application version */
  appVersion: string
  /** Event bus */
  events: ReturnType<typeof createStoreEvents>
}>()

const emits = defineEmits<{
  (e: 'addRequest'): void
  (e: 'sendRequest'): void
  (e: 'openCommandPalette'): void
}>()

const handleHotKey = (event?: HotKeyEvent) => {
  if (event?.createNew) {
    emits('addRequest')
  }
}

onMounted(() => events.hotKeys.on(handleHotKey))
onBeforeUnmount(() => events.hotKeys.off(handleHotKey))
</script>
<template>
  <div class="flex-center relative flex flex-1 flex-col gap-6 p-2 capitalize">
    <div
      class="flex h-[calc(100%_-_50px)] flex-col items-center justify-center"
      :class="{
        'hidden opacity-0': totalPerformedRequests < 1 && layout !== 'modal',
      }">
      <div
        v-if="layout !== 'modal'"
        class="scalar-version-number">
        Scalar App V{{ appVersion }} Beta
        <div class="mt-2">
          <a
            href="https://github.com/scalar/scalar/issues/2669"
            target="_blank">
            Roadmap
          </a>
        </div>
      </div>
      <a
        class="gitbook-show scalar-version-number"
        href="https://www.scalar.com"
        target="_blank">
        Powered By Scalar.com
      </a>
      <ScalarAsciiArt
        :art="Computer"
        class="text-c-3" />
    </div>
    <div
      v-if="layout !== 'modal'"
      class="hidden h-[calc(100%_-_50px)] items-center justify-center pb-5"
      :class="{
        '!flex opacity-100': totalPerformedRequests == 0,
      }">
      <EmptyState />
    </div>
    <div
      class="text-c-3 right-4 mt-auto flex w-full flex-col items-end gap-2 text-sm">
      <button
        v-if="layout !== 'modal'"
        class="flex items-center gap-1.5"
        type="button"
        @click="emits('openCommandPalette')">
        Get Started
        <ScalarHotkey hotkey="k" />
      </button>
      <button
        v-if="layout === 'desktop'"
        class="flex items-center gap-1.5"
        type="button"
        @click="emits('addRequest')">
        New Request
        <ScalarHotkey hotkey="N" />
      </button>
      <button
        class="flex items-center gap-1.5"
        type="button"
        @click="emits('sendRequest')">
        Send Request
        <ScalarHotkey hotkey="↵" />
      </button>
    </div>
  </div>
</template>
<style scoped>
.scalar-version-number {
  transform: skew(0deg, 13deg);
  width: 76px;
  height: 76px;
  position: absolute;
  margin-left: -36px;
  font-size: 8px;
  font-family: var(--scalar-font-code);
  line-height: 11px;
  margin-top: -113px;
  border-radius: 9px 9px 16px 12px;
  box-shadow: inset 2px 0px 0 2px var(--scalar-background-2);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-transform: initial;
  text-decoration-color: var(--scalar-color-3);
}
.scalar-version-number a {
  font-weight: bold;
  font-weight: bold;
  background: var(--scalar-background-2);
  padding: 2px 4px;
  border-radius: 3px;
  text-decoration: none;
  border: 0.5px solid var(--scalar-border-color);
}

.gitbook-show {
  display: none;
}
</style>
