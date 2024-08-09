<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import { executeRequestBus } from '@/libs'
import { useWorkspace } from '@/store/workspace'
import { Listbox } from '@headlessui/vue'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { REQUEST_METHODS, type RequestMethod } from '@scalar/oas-utils/helpers'
import { isMacOS } from '@scalar/use-tooltip'
import { useMagicKeys, whenever } from '@vueuse/core'
import { ref, watch } from 'vue'

import { useWebSocket } from './useWebSocket'

const { setUrl, connect, disconnect, isConnected, url } = useWebSocket()

function handleUrlUpdate(value: string) {
  console.log('handleUrlUpdate', value)
  setUrl(value)
}

function handleConnect() {
  console.log('handleConnect', isConnected.value)
  if (isConnected.value) {
    disconnect()
  } else {
    connect()
  }
}
</script>
<template>
  <div class="order-last lg:order-none lg:w-auto w-full">
    <div class="m-auto flex basis-1/2 flex-row items-center">
      <!-- Address Bar -->
      <Listbox v-slot="{ open }">
        <div
          :class="[
            'text-xxs bg-b-1 relative flex w-full lg:min-w-[720px] lg:max-w-[720px] order-last lg:order-none flex-1 flex-row items-stretch rounded border p-[3px]',
            { 'rounded-b-none': open },
            { 'border-transparent': open },
          ]">
          <div class="flex gap-1">
            <span class="font-code text-xxs font-medium">websocket</span>
          </div>
          <div
            class="scroll-timeline-x scroll-timeline-x-hidden relative flex w-full">
            <div class="fade-left"></div>

            <CodeInput
              disableCloseBrackets
              disableEnter
              disableTabIndent
              :emitOnBlur="false"
              :modelValue="url"
              placeholder="Enter URL to get started"
              @update:modelValue="handleUrlUpdate" />
            <div class="fade-right"></div>
          </div>

          <ScalarButton
            class="relative h-auto shrink-0 gap-1 overflow-hidden pl-2 pr-2.5 py-1 z-[1] font-bold"
            @click="handleConnect">
            <ScalarIcon
              class="relative z-10 shrink-0 fill-current"
              icon="Play"
              size="xs" />
            <span class="text-xxs relative z-10 lg:flex hidden">{{
              isConnected ? 'Disconnect' : 'Connect'
            }}</span>
          </ScalarButton>
        </div>
      </Listbox>
    </div>
  </div>
</template>
<style scoped>
:deep(.cm-editor) {
  background-color: var(--scalar-background-1);
  height: 100%;
  outline: none;
  width: 100%;
}
:deep(.cm-content) {
  padding: 0;
  display: flex;
  align-items: center;
}
.scroll-timeline-x {
  scroll-timeline: --scroll-timeline x;
  /* Firefox supports */
  scroll-timeline: --scroll-timeline horizontal;
  -ms-overflow-style: none; /* IE and Edge */
}
.scroll-timeline-x-hidden {
  overflow: auto;
  scrollbar-width: none;
}
.scroll-timeline-x-hidden::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.scroll-timeline-x-address {
  line-height: 27px;
  scrollbar-width: none; /* Firefox */
}
/* make clickable are to left of send button */
.scroll-timeline-x-address:after {
  content: '';
  position: absolute;
  height: 100%;
  width: 24px;
  right: 0;
  cursor: text;
}
.scroll-timeline-x-address:empty:before {
  content: 'Enter URL or cURL request';
  color: var(--scalar-color-3);
  pointer-events: none;
}
.fade-left,
.fade-right {
  content: '';
  position: sticky;
  height: 100%;
  animation-name: fadein;
  animation-duration: 1ms;
  animation-direction: reverse;
  animation-timeline: --scroll-timeline;
  z-index: 1;
  pointer-events: none;
}
.fade-left {
  background: linear-gradient(
    -90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 30%,
    var(--scalar-background-1) 100%
  );
  left: 0;
  min-width: 3px;
  animation-direction: normal;
}
.fade-right {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 30%,
    var(--scalar-background-1) 100%
  );
  right: 0;
  min-width: 24px;
}
@keyframes fadein {
  0% {
    opacity: 0;
  }
  1% {
    opacity: 1;
  }
}
</style>
