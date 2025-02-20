<script setup lang="ts">
import { ScalarButton, ScalarIcon } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type {
  Collection,
  Operation,
  RequestMethod,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { REQUEST_METHODS } from '@scalar/oas-utils/helpers'
import { ref, useId, watch } from 'vue'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import { ServerDropdown } from '@/components/Server'
import { useLayout } from '@/hooks'
import { useWorkspace } from '@/store'
import type { EnvVariable } from '@/store/active-entities'

import HttpMethod from '../HttpMethod/HttpMethod.vue'
import AddressBarHistory from './AddressBarHistory.vue'

const { collection, operation, server, environment, envVariables, workspace } =
  defineProps<{
    collection: Collection
    operation: Operation
    server: Server | undefined
    environment: Environment
    envVariables: EnvVariable[]
    workspace: Workspace
  }>()

defineEmits<{
  (e: 'importCurl', value: string): void
}>()

const id = useId()

const { requestMutators, events } = useWorkspace()

const { layout } = useLayout()

const addressBarRef = ref<typeof CodeInput | null>(null)

/** update the instance path parameters on change */
const onUrlChange = (newPath: string) => {
  if (operation.path === newPath) return
  requestMutators.edit(operation.uid, 'path', newPath)
}

/** watch for changes in the URL */
watch(
  () => operation.path,
  (newURL) => {
    if (!newURL) return
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

events.requestStatus.on((status) => {
  if (status === 'start') startLoading()
  if (status === 'stop') stopLoading()
  if (status === 'abort') abortLoading()
})

function updateRequestMethod(method: RequestMethod) {
  requestMutators.edit(operation.uid, 'method', method)
}

function getBackgroundColor() {
  const { method } = operation
  return REQUEST_METHODS[method].backgroundColor
}

function handleExecuteRequest() {
  if (isRequesting.value) return
  isRequesting.value = true
  events.executeRequest.emit({ requestUid: operation.uid })
}

/** Handle hotkeys */
events.hotKeys.on((event) => {
  if (event?.focusAddressBar) addressBarRef.value?.focus()
  if (event?.executeRequest) handleExecuteRequest()
})

/**
 * TODO: Should we handle query params here somehow?
 */
function updateRequestPath(url: string) {
  requestMutators.edit(operation.uid, 'path', url)
}
</script>
<template>
  <div
    :id="id"
    class="scalar-address-bar order-last h-[--scalar-address-bar-height] w-full [--scalar-address-bar-height:32px] lg:order-none lg:w-auto">
    <div class="m-auto flex flex-row items-center">
      <!-- Address Bar -->
      <div
        class="addressbar-bg-states text-xxs p-0.75 group relative order-last flex w-full max-w-[calc(100dvw-24px)] flex-1 flex-row items-stretch rounded-lg lg:order-none lg:min-w-[580px] lg:max-w-[580px] xl:min-w-[720px] xl:max-w-[720px]">
        <div
          class="pointer-events-none absolute left-0 top-0 block h-full w-full overflow-hidden rounded-lg border">
          <div
            class="bg-mix-transparent bg-mix-amount-90 z-context absolute left-0 top-0 h-full w-full"
            :class="getBackgroundColor()"
            :style="{ transform: `translate3d(-${percentage}%,0,0)` }" />
        </div>
        <div class="z-context-plus flex gap-1">
          <HttpMethod
            :isEditable="layout !== 'modal'"
            isSquare
            :method="operation.method"
            teleport
            @change="updateRequestMethod" />
        </div>

        <div
          class="codemirror-bg-switcher scroll-timeline-x scroll-timeline-x-hidden z-context-plus relative flex w-full">
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
            :workspace="workspace"
            @curl="$emit('importCurl', $event)"
            @submit="handleExecuteRequest"
            @update:modelValue="updateRequestPath" />
          <div class="fade-right" />
        </div>

        <AddressBarHistory
          :operation="operation"
          :target="id" />
        <ScalarButton
          class="z-context-plus relative h-auto shrink-0 overflow-hidden py-1 pl-2 pr-2.5 font-bold"
          :disabled="isRequesting"
          @click="handleExecuteRequest">
          <span
            aria-hidden="true"
            class="inline-flex items-center gap-1">
            <ScalarIcon
              class="relative shrink-0 fill-current"
              icon="Play"
              size="xs" />
            <span class="text-xxs hidden lg:flex">Send</span>
          </span>
          <span class="sr-only"> Send Request </span>
        </ScalarButton>
      </div>
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
  font-size: var(--scalar-mini);
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
  --scalar-background-1: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
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
