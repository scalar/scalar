<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import {
  type HotKeyEvents,
  executeRequestBus,
  hotKeyBus,
  requestStatusBus,
} from '@/libs'
import { useWorkspace } from '@/store/workspace'
import { Listbox } from '@headlessui/vue'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { REQUEST_METHODS, type RequestMethod } from '@scalar/oas-utils/helpers'
import { isMacOS } from '@scalar/use-tooltip'
import { useMagicKeys, whenever } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import HttpMethod from '../HttpMethod/HttpMethod.vue'
import AddressBarHistory from './AddressBarHistory.vue'

const {
  activeRequest,
  activeExample,
  isReadOnly,
  requestMutators,
  requestExampleMutators,
  requestsHistory,
} = useWorkspace()

const history = requestsHistory
const selectedRequest = ref(history.value[0])
const addressBarRef = ref<typeof CodeInput | null>(null)

const keys = useMagicKeys()
whenever(isMacOS() ? keys.meta_enter : keys.ctrl_enter, () =>
  executeRequestBus.emit(),
)

/** update the instance path parameters on change */
const onUrlChange = (newPath: string) => {
  if (!activeRequest.value || activeRequest.value.path === newPath) return

  requestMutators.edit(activeRequest.value.uid, 'path', newPath)
}

/** watch for changes in the URL */
watch(
  () => activeRequest.value?.path,
  (newURL) => {
    if (!activeRequest.value) return
    onUrlChange(newURL)
  },
)

/** The amount remaining to load from 100 -> 0 */
const percentage = ref(100)
/** Keeps track of how much was left when the request finished */
const remaining = ref(0)
/** Whether or not there is a request loading */
const isRequesting = ref(false)
/** The loading interval */
const interval = ref<ReturnType<typeof setInterval>>()

function load() {
  if (isRequesting.value) {
    // Reduce asymptotically up to 85% loaded
    percentage.value -= (percentage.value - 15) / 60
  } else {
    // Always finish loading linearly over 400ms
    percentage.value -= remaining.value / 20
  }
  if (percentage.value <= 0) {
    clearInterval(interval.value)
    interval.value = undefined
    percentage.value = 100
    isRequesting.value = false
  }
}

function startLoading() {
  if (interval.value) return
  isRequesting.value = true
  interval.value = setInterval(load, 20)
}

function stopLoading() {
  remaining.value = percentage.value
  isRequesting.value = false
}

function abortLoading() {
  clearInterval(interval.value)
  interval.value = undefined
  percentage.value = 100
  isRequesting.value = false
}

requestStatusBus.on((status) => {
  if (status === 'start') startLoading()
  if (status === 'stop') stopLoading()
  if (status === 'abort') abortLoading()
})

function updateRequestMethod(method: RequestMethod) {
  if (!activeRequest.value) return
  requestMutators.edit(activeRequest.value.uid, 'method', method)
}

function getBackgroundColor() {
  if (!activeRequest.value) return undefined
  const { method } = activeRequest.value
  return REQUEST_METHODS[method as RequestMethod].backgroundColor
}

function handleExecuteRequest() {
  if (isRequesting.value) return
  isRequesting.value = true
  executeRequestBus.emit()
}

const updateExampleUrlHandler = (url: string) => {
  requestExampleMutators.edit(activeExample.value.uid, 'url', url)
}

/** Handle hotkeys */
const handleHotKey = (event: HotKeyEvents) => {
  if (event.focusAddressBar) {
    addressBarRef.value?.focus()
  }
}

onMounted(() => hotKeyBus.on(handleHotKey))
onBeforeUnmount(() => hotKeyBus.off(handleHotKey))
</script>
<template>
  <div
    v-if="activeRequest && activeExample"
    class="order-last lg:order-none lg:w-auto w-full">
    <div class="m-auto flex basis-1/2 flex-row items-center">
      <!-- Address Bar -->
      <Listbox
        v-slot="{ open }"
        v-model="selectedRequest">
        <div
          :class="[
            'addressbar-bg-states text-xxs relative flex w-full lg:min-w-[720px] lg:max-w-[720px] order-last lg:order-none flex-1 flex-row items-stretch rounded-lg border-1/2 p-[3px]',
            { 'rounded-b-none': open },
            { 'border-transparent': open },
          ]">
          <div
            class="pointer-events-none absolute left-0 top-0 z-10 block h-full w-full overflow-hidden">
            <div
              class="bg-mix-transparent bg-mix-amount-90 absolute left-0 top-0 h-full w-full"
              :class="getBackgroundColor()"
              :style="{ transform: `translate3d(-${percentage}%,0,0)` }"></div>
          </div>
          <div class="flex gap-1">
            <HttpMethod
              :isEditable="!isReadOnly"
              isSquare
              :method="activeRequest.method"
              @change="updateRequestMethod" />
          </div>
          <div
            class="codemirror-bg-switcher scroll-timeline-x scroll-timeline-x-hidden relative flex w-full">
            <div class="fade-left"></div>

            <CodeInput
              ref="addressBarRef"
              disableCloseBrackets
              :disabled="isReadOnly"
              disableEnter
              disableTabIndent
              :emitOnBlur="false"
              :modelValue="activeExample.url"
              placeholder="Enter URL to get started"
              server
              @submit="handleExecuteRequest"
              @update:modelValue="updateExampleUrlHandler" />
            <div class="fade-right"></div>
          </div>

          <AddressBarHistory :open="open" />
          <ScalarButton
            class="relative h-auto shrink-0 gap-1 overflow-hidden pl-2 pr-2.5 py-1 z-[1] font-bold"
            :disabled="isRequesting"
            @click="handleExecuteRequest">
            <ScalarIcon
              class="relative z-10 shrink-0 fill-current"
              icon="Play"
              size="xs" />
            <span class="text-xxs relative z-10 lg:flex hidden">Send</span>
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
  overflow: hidden;
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
.codemirror-bg-switcher {
  --scalar-background-1: var(--scalar-background-2);
}
.addressbar-bg-states :deep(.adressbar-history-button:hover) {
  background: var(--scalar-background-3);
}
.addressbar-bg-states:focus-within :deep(.adressbar-history-button:hover) {
  background: var(--scalar-background-2);
}
.addressbar-bg-states:focus-within .codemirror-bg-switcher {
  --scalar-background-1: var(--scalar-background-1);
}
.addressbar-bg-states {
  background: var(--scalar-background-2);
  border-color: transparent;
}
.addressbar-bg-states:focus-within {
  background: var(--scalar-background-1);
  border-color: var(--scalar-border-color);
}
</style>
