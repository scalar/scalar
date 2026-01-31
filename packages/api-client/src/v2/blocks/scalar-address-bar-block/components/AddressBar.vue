<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarWrappingText,
} from '@scalar/components'
import { REQUEST_METHODS } from '@scalar/helpers/http/http-info'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { ScalarIconCopy, ScalarIconWarningCircle } from '@scalar/icons'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import type {
  ApiReferenceEvents,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useTemplateRef,
} from 'vue'

import { HttpMethod } from '@/components/HttpMethod'
import { type ClientLayout } from '@/hooks'
import { getResolvedUrl } from '@/v2/blocks/operation-block/helpers/get-resolved-url'
import { useLoadingAnimation } from '@/v2/blocks/scalar-address-bar-block/hooks/use-loading-animation'
import { CodeInput } from '@/v2/components/code-input'
import { ServerDropdown } from '@/v2/components/server'

import AddressBarHistory, { type History } from './AddressBarHistory.vue'

const {
  path,
  method,
  layout,
  eventBus,
  history,
  server,
  servers,
  environment,
} = defineProps<{
  /** Current request path */
  path: string
  /** Current request method */
  method: HttpMethodType
  /** Currently selected server */
  server: ServerObject | null
  /** Server list available for operation/document */
  servers: ServerObject[]
  /** List of request history */
  history: History[]
  /** Client layout */
  layout: ClientLayout
  /** Event bus */
  eventBus: WorkspaceEventBus
  /** Environment */
  environment: XScalarEnvironment
}>()

const emit = defineEmits<{
  /** Execute the current operation example */
  (e: 'execute'): void
  /** Update the server list */
  (e: 'update:servers'): void
  /** Select a request history item by index */
  (e: 'select:history:item', payload: { index: number }): void
}>()

const id = useId()
const { percentage, startLoading, stopLoading, isLoading } =
  useLoadingAnimation()

/** Calculate the style for the address bar */
const style = computed(() => ({
  backgroundColor: `color-mix(in srgb, transparent 90%, ${REQUEST_METHODS[method].colorVar})`,
  transform: `translate3d(-${percentage.value}%,0,0)`,
}))

const pathConflict = ref<string | null>(null)
const methodConflict = ref<HttpMethodType | null>(null)

/** Whether there is a path or method conflict */
const hasConflict = computed(() => methodConflict.value || pathConflict.value)

/** Emit the path/method update event with conflict handling */
const emitPathMethodUpdate = (
  targetMethod: HttpMethodType,
  targetPath: string,
  /** We only want to debounce when the path changes */
  emitOptions?: { debounceKey?: string },
): void => {
  const position = addressBarRef.value?.cursorPosition()
  eventBus.emit(
    'operation:update:pathMethod',
    {
      meta: { method, path },
      payload: { method: targetMethod, path: targetPath },
      callback: (status) => {
        // Clear conflicts if the operation was successful or no change was made
        if (status === 'success' || status === 'no-change') {
          methodConflict.value = null
          pathConflict.value = null
        }
        if (status === 'success') {
          eventBus.emit('ui:focus:address-bar', { position })
        }
        // Otherwise set the conflict if needed
        else if (status === 'conflict') {
          if (targetMethod !== method) {
            methodConflict.value = targetMethod
          }
          if (targetPath !== path) {
            pathConflict.value = targetPath
          }
        }
      },
    },
    emitOptions,
  )
}

/** Update the operation's HTTP method, handling conflicts */
const handleMethodChange = (newMethod: HttpMethodType): void =>
  emitPathMethodUpdate(newMethod, pathConflict.value ?? path)

/** Update the operation's path, handling conflicts */
const handlePathChange = (newPath: string): void => {
  const normalizedPath = newPath.startsWith('/') ? newPath : `/${newPath}`
  emitPathMethodUpdate(methodConflict.value ?? method, normalizedPath, {
    debounceKey: `operation:update:pathMethod-${path}-${method}`,
  })
}

/** Handle focus events */
const sendButtonRef = useTemplateRef('sendButtonRef')
const addressBarRef = useTemplateRef('addressBarRef')
const handleFocusSendButton = () => sendButtonRef.value?.$el?.focus()

const handleFocusAddressBar = (
  payload: ApiReferenceEvents['ui:focus:address-bar'],
) => {
  // If it already has focus we just propagate native behavior which should focus the browser address bar
  if (addressBarRef.value?.isFocused && layout !== 'desktop') {
    return
  }

  const position = payload && 'position' in payload ? payload.position : 'end'
  addressBarRef.value?.focus(position)

  if (payload && 'event' in payload) {
    payload.event.preventDefault()
  }
}

onMounted(() => {
  eventBus.on('ui:focus:address-bar', handleFocusAddressBar)
  eventBus.on('ui:focus:send-button', handleFocusSendButton)
  eventBus.on('hooks:on:request:sent', startLoading)
  eventBus.on('hooks:on:request:complete', stopLoading)
})

onBeforeUnmount(() => {
  eventBus.off('ui:focus:address-bar', handleFocusAddressBar)
  eventBus.off('ui:focus:send-button', handleFocusSendButton)
  eventBus.off('hooks:on:request:sent', startLoading)
  eventBus.off('hooks:on:request:complete', stopLoading)

  // Stop the animation when the component is unmounted
  // This is to prevent the animation from continuing after the component is unmounted
  stopLoading()
})

const { copyToClipboard } = useClipboard()

const copyUrl = async () => {
  await copyToClipboard(
    getResolvedUrl({ environment, server, path, pathVariables: {} }),
  )
}

const isServerDropdownOpen = ref(false)
const isHistoryDropdownOpen = ref(false)

/** Whether either dropdown is open */
const isDropdownOpen = computed(
  () => isServerDropdownOpen.value || isHistoryDropdownOpen.value,
)

defineExpose({
  methodConflict,
  pathConflict,
})
</script>
<template>
  <div
    :id="id"
    class="scalar-address-bar order-last flex h-(--scalar-address-bar-height) w-full [--scalar-address-bar-height:32px] lg:order-0 lg:w-auto">
    <!-- Address Bar -->
    <div
      class="address-bar-bg-states text-xxs group relative order-last flex w-full max-w-[calc(100dvw-24px)] flex-1 flex-row items-stretch rounded-lg p-0.75 lg:order-none lg:max-w-[580px] lg:min-w-[580px] xl:max-w-[720px] xl:min-w-[720px]"
      :class="{
        'outline-c-danger outline': hasConflict,
        'rounded-b-none': isDropdownOpen,
      }">
      <div
        class="pointer-events-none absolute top-0 left-0 block h-full w-full overflow-hidden rounded-lg border"
        :class="{
          'rounded-b-none': isDropdownOpen,
        }">
        <div
          class="absolute top-0 left-0 h-full w-full"
          :style />
      </div>
      <div class="flex gap-1">
        <HttpMethod
          :isEditable="layout !== 'modal'"
          isSquare
          :method="methodConflict ?? method"
          teleport
          @change="handleMethodChange" />
      </div>

      <div
        class="scroll-timeline-x scroll-timeline-x-hidden relative flex w-full bg-blend-normal">
        <!-- Servers -->
        <ServerDropdown
          v-if="servers.length"
          :layout="layout"
          :server="server"
          :servers="servers"
          :target="id"
          @update:open="(value) => (isServerDropdownOpen = value)"
          @update:selectedServer="
            (payload) => eventBus.emit('server:update:selected', payload)
          "
          @update:servers="emit('update:servers')"
          @update:variable="
            (payload) => eventBus.emit('server:update:variables', payload)
          " />

        <div class="fade-left" />
        <!-- Path + URL + env vars -->
        <CodeInput
          ref="addressBarRef"
          alwaysEmitChange
          aria-label="Path"
          class="min-w-fit outline-none"
          disableCloseBrackets
          :disabled="layout === 'modal'"
          disableEnter
          disableTabIndent
          :emitOnBlur="false"
          :environment="environment"
          importCurl
          :layout="layout"
          :modelValue="path"
          :placeholder="server ? '' : 'Enter a URL'"
          server
          @submit="emit('execute')"
          @update:modelValue="handlePathChange" />
        <div class="fade-right" />
      </div>

      <!-- Copy url button -->
      <ScalarButton
        class="hover:bg-b-3 mx-1"
        size="xs"
        variant="ghost"
        @click="copyUrl">
        <ScalarIconCopy />
        <span class="sr-only">Copy URL</span>
      </ScalarButton>

      <AddressBarHistory
        :history="history"
        :target="id"
        @select:history:item="(payload) => emit('select:history:item', payload)"
        @update:open="(value) => (isHistoryDropdownOpen = value)" />
      <!-- Error message -->
      <div
        v-if="hasConflict"
        class="absolute inset-x-0 top-[calc(100%+4px)] flex flex-col items-center rounded px-6">
        <div
          class="text-c-danger bg-b-danger border-c-danger flex items-center gap-1 rounded border p-1">
          <ScalarIconWarningCircle size="sm" />
          <div class="min-w-0 flex-1">
            A
            <em>{{ methodConflict?.toUpperCase() ?? method.toUpperCase() }}</em>
            request to
            <ScalarWrappingText :text="pathConflict ?? path" />
            already exists in this document
          </div>
        </div>
      </div>
      <ScalarButton
        ref="sendButtonRef"
        class="relative h-auto shrink-0 overflow-hidden py-1 pr-2.5 pl-2 font-bold"
        :disabled="isLoading"
        @click="emit('execute')">
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
          Send {{ method }} request to {{ server?.url ?? '' }}{{ path }}
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
  outline-width: 1px;
  outline-style: solid;
}
.address-bar-bg-states:has(.cm-focused) .fade-left,
.address-bar-bg-states:has(.cm-focused) .fade-right {
  --scalar-address-bar-bg: var(--scalar-background-1);
}
</style>
