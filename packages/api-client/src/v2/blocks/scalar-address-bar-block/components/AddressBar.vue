<script setup lang="ts">
import { ScalarButton, ScalarIcon } from '@scalar/components'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type {
  Collection,
  Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { REQUEST_METHODS } from '@scalar/oas-utils/helpers'
import { ref, useId } from 'vue'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import { HttpMethod } from '@/components/HttpMethod'
import { ServerDropdown } from '@/components/Server'
import { type ClientLayout } from '@/hooks'
import { useWorkspace } from '@/store'
import type { EnvVariable } from '@/store/active-entities'

import AddressBarHistory, { type History } from './AddressBarHistory.vue'

const {
  layout,
  history,
  collection,
  operation,
  server,
  environment,
  envVariables,
  percentage,
} = defineProps<{
  collection: Collection
  operation: Operation
  /** Currently selected server */
  server: Server | undefined
  /** Environment variables used for codemirror variables pill on input */
  environment: Environment
  envVariables: EnvVariable[]
  history: History[]
  /** Client layout */
  layout: ClientLayout
  /** The amount remaining to load from 100 -> 0 */
  percentage: number
}>()

const emits = defineEmits<{
  /** Import a cURL command */
  (e: 'importCurl', value: string): void
  /** Update the current operation method */
  (e: 'update:method', payload: { method: HttpMethodType }): void
  /** Update the current operation path */
  (e: 'update:path', payload: { path: string }): void
  /** Execute the current operation example */
  (e: 'execute'): void
}>()

const id = useId()

const { events } = useWorkspace()

const addressBarRef = ref<typeof CodeInput | null>(null)
const sendButtonRef = ref<typeof ScalarButton | null>(null)

function getBackgroundColor() {
  const { method } = operation
  return REQUEST_METHODS[method].colorVar
}

/** Handle hotkeys */
events.hotKeys.on((event) => {
  if (event?.focusAddressBar) {
    addressBarRef.value?.focus()
  }
})

/** Focus the address bar (or the send button if in modal layout) */
events.focusAddressBar.on(() => {
  if (layout === 'modal') {
    sendButtonRef.value?.$el?.focus()
  } else {
    addressBarRef.value?.focus()
  }
})
</script>
<template>
  <div
    :id="id"
    class="scalar-address-bar order-last flex h-(--scalar-address-bar-height) w-full [--scalar-address-bar-height:32px] lg:order-none lg:w-auto">
    <!-- Address Bar -->
    <div
      class="address-bar-bg-states text-xxs group relative order-last flex w-full max-w-[calc(100dvw-24px)] flex-1 flex-row items-stretch rounded-lg p-0.75 lg:order-none lg:max-w-[580px] lg:min-w-[580px] xl:max-w-[720px] xl:min-w-[720px]">
      <div
        class="pointer-events-none absolute top-0 left-0 block h-full w-full overflow-hidden rounded-lg border">
        <div
          class="absolute top-0 left-0 z-[1002] h-full w-full"
          :style="{
            backgroundColor: `color-mix(in srgb, transparent 90%, ${getBackgroundColor()})`,
            transform: `translate3d(-${percentage}%,0,0)`,
          }" />
      </div>
      <div class="z-context-plus flex gap-1">
        <HttpMethod
          :isEditable="layout !== 'modal'"
          isSquare
          :method="operation.method"
          teleport
          @change="emits('update:method', { method: $event })" />
      </div>

      <div
        class="scroll-timeline-x scroll-timeline-x-hidden z-context-plus relative flex w-full bg-blend-normal">
        <!-- Servers -->
        <ServerDropdown
          v-if="collection.servers.length"
          :collection="collection"
          layout="client"
          :operation="operation"
          :server="server"
          :target="id" />

        <div class="fade-left" />
        <!-- Path + URL + env vars -->
        <CodeInput
          ref="addressBarRef"
          aria-label="Path"
          class="min-w-fit outline-none"
          disableCloseBrackets
          :disabled="layout === 'modal'"
          disableEnter
          disableTabIndent
          :emitOnBlur="false"
          :envVariables="envVariables"
          :environment="environment"
          importCurl
          :modelValue="operation.path"
          :placeholder="
            server?.uid && collection.servers.includes(server.uid)
              ? ''
              : 'Enter a URL or cURL command'
          "
          server
          @curl="$emit('importCurl', $event)"
          @submit="emits('execute')"
          @update:modelValue="emits('update:path', { path: $event })" />
        <div class="fade-right" />
      </div>

      <AddressBarHistory
        :history="history"
        :target="id" />
      <ScalarButton
        ref="sendButtonRef"
        class="z-context-plus relative h-auto shrink-0 overflow-hidden py-1 pr-2.5 pl-2 font-bold"
        :disabled="percentage < 100"
        @click="emits('execute')">
        <span
          aria-hidden="true"
          class="inline-flex items-center gap-1">
          <ScalarIcon
            class="relative shrink-0 fill-current"
            icon="Play"
            size="xs" />
          <span class="text-xxs hidden lg:flex">Send</span>
        </span>
        <span class="sr-only">
          Send {{ operation.method }} request to {{ server?.url ?? ''
          }}{{ operation.path }}
        </span>
      </ScalarButton>
    </div>
  </div>
</template>
<style scoped>
:deep(.cm-editor) {
  height: 100%;
  outline: none;
  width: 100%;
}
:deep(.cm-line) {
  padding: 0;
}
:deep(.cm-content) {
  padding: 0;
  display: flex;
  align-items: center;
  font-size: var(--scalar-small);
}
.scroll-timeline-x {
  scroll-timeline: --scroll-timeline x;
  /* Firefox supports */
  scroll-timeline: --scroll-timeline horizontal;
  -ms-overflow-style: none; /* IE and Edge */
}
.scroll-timeline-x-hidden {
  overflow-x: auto;
}
.scroll-timeline-x-hidden :deep(.cm-scroller) {
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-right: 20px;
  overflow: auto;
}
.scroll-timeline-x-hidden::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
.scroll-timeline-x-hidden :deep(.cm-scroller::-webkit-scrollbar) {
  width: 0;
  height: 0;
  display: none;
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
  pointer-events: none;
  z-index: 1;
}
.fade-left {
  background: linear-gradient(
    -90deg,
    color-mix(in srgb, var(--scalar-address-bar-bg), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-address-bar-bg), transparent 20%) 30%,
    var(--scalar-address-bar-bg) 100%
  );
  left: -1px;
  min-width: 6px;
  animation-direction: normal;
}
.fade-right {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--scalar-address-bar-bg), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-address-bar-bg), transparent 20%) 30%,
    var(--scalar-address-bar-bg) 100%
  );
  right: -1px;
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
.address-bar-bg-states {
  --scalar-address-bar-bg: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
  background: var(--scalar-address-bar-bg);
}
.address-bar-bg-states:has(.cm-focused) {
  --scalar-address-bar-bg: var(--scalar-background-1);
  border-color: var(--scalar-border-color);
  outline: 1px solid var(--scalar-color-accent);
}
.address-bar-bg-states:has(.cm-focused) .fade-left,
.address-bar-bg-states:has(.cm-focused) .fade-right {
  --scalar-address-bar-bg: var(--scalar-background-1);
}
</style>
