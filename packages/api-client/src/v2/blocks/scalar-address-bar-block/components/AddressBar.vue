<script lang="ts">
/**
 * AddressBar component
 * This component is used to display the address bar for the operation block
 * It is used to display the path, method, server, and history for the operation
 */
export default {
  name: 'AddressBar',
}
export type AddressBarProps = {
  /** Current request path */
  path: string
  /** Current request method */
  method: HttpMethodType
  /** Currently selected server */
  server: ServerObject | null
  /** Server list available for operation/document */
  servers: ServerObject[]
  /** All available servers (collection + request) for matching pasted URLs */
  allAvailableServers: ServerObject[]
  /** List of request history */
  history: History[]
  /** Client layout */
  layout: ClientLayout
  /** Event bus */
  eventBus: WorkspaceEventBus
  /** Environment */
  environment: XScalarEnvironment
  /** Meta information for the server */
  serverMeta: ServerMeta
}
</script>
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
  ServerMeta,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useTemplateRef,
  watch,
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
  allAvailableServers,
  environment,
  serverMeta,
} = defineProps<AddressBarProps>()

const emit = defineEmits<{
  /** Execute the current operation example */
  (e: 'execute'): void
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

/** Track the previous path value to detect paste operations */
const previousPathValue = ref<string>(path)

/** Sync previousPathValue when path prop changes externally (e.g., after URL parsing) */
watch(
  () => path,
  (newPath) => {
    previousPathValue.value = newPath
  },
)

/** Whether there is a path or method conflict */
const hasConflict = computed(() => methodConflict.value || pathConflict.value)

/**
 * Check if a string looks like a full URL with protocol
 */
const isFullUrl = (value: string): boolean => {
  const trimmed = value.trim()
  return /^https?:\/\//i.test(trimmed)
}

/**
 * Detect if a change is likely from a paste operation (many characters at once)
 * vs typing character by character
 */
const isPasteOperation = (oldValue: string, newValue: string): boolean => {
  // If the old value was not a full URL but the new value is, it's definitely a paste
  // This handles cases where user selects all and pastes a shorter URL
  if (!isFullUrl(oldValue) && isFullUrl(newValue)) {
    return true
  }

  // If both are URLs but significantly different in length, it's a paste
  // This handles pasting a different URL over an existing one
  const lengthDiff = Math.abs(newValue.length - oldValue.length)
  return lengthDiff >= 5
}

/**
 * Parse a full URL and extract the origin and path
 */
const parseFullUrl = (
  value: string,
): { origin: string; path: string } | null => {
  try {
    const url = new URL(value.trim())
    return {
      origin: url.origin,
      path: url.pathname + url.search + url.hash,
    }
  } catch {
    return null
  }
}

/**
 * Find a matching server from available servers by origin.
 * First checks the current level's servers, then falls back to all available servers.
 * Returns both the server and whether it was found in the current level.
 */
const findMatchingServer = (
  origin: string,
): { server: ServerObject; inCurrentLevel: boolean } | null => {
  const matchOrigin = (serverList: ServerObject[]): ServerObject | null => {
    for (const s of serverList) {
      try {
        // Handle server URLs that might have trailing slashes
        const serverUrl = s.url?.replace(/\/$/, '') ?? ''
        // Parse the server URL to compare origins exactly
        const serverOrigin = new URL(serverUrl).origin
        if (serverOrigin === origin) {
          return s
        }
      } catch {
        // Server URL might have variables, try direct comparison
        if (s.url === origin) {
          return s
        }
      }
    }
    return null
  }

  // First check the current level's servers
  const currentLevelMatch = matchOrigin(servers)
  if (currentLevelMatch) {
    return { server: currentLevelMatch, inCurrentLevel: true }
  }

  // Fall back to all available servers (includes servers from other levels)
  const allLevelMatch = matchOrigin(allAvailableServers)
  if (allLevelMatch) {
    return { server: allLevelMatch, inCurrentLevel: false }
  }

  return null
}

/**
 * Handle a full URL being entered - match or add server, update path.
 * This is called when a full URL (with protocol) is pasted into the omnibar.
 * We handle this immediately without debouncing to ensure clean UX.
 */
const handleFullUrlInput = async (fullUrl: string): Promise<void> => {
  const parsed = parseFullUrl(fullUrl)
  if (!parsed) {
    return
  }

  const { origin, path: urlPath } = parsed
  const normalizedPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`
  const match = findMatchingServer(origin)

  if (match?.inCurrentLevel) {
    // Server exists in current level - select it directly
    eventBus.emit('server:update:selected', {
      url: match.server.url,
      meta: serverMeta,
    })
  } else {
    // Either no matching server, or server is in a different level
    // Add the server to operation level and select it there
    const operationMeta: ServerMeta =
      serverMeta.type === 'operation'
        ? serverMeta
        : { type: 'operation', path, method }

    // When adding to operation level from document level, the new server will be at index 0
    // When already at operation level, it will be at servers.length
    const newServerIndex = serverMeta.type === 'operation' ? servers.length : 0

    // First add a blank server
    eventBus.emit('server:add:server', { meta: operationMeta })

    // Wait for Vue to process the event and update reactivity
    await nextTick()

    // Update the newly added server with the origin URL
    eventBus.emit('server:update:server', {
      index: newServerIndex,
      server: { url: origin },
      meta: operationMeta,
    })

    // Wait for the update to be processed
    await nextTick()

    // Select the newly added server as active
    eventBus.emit('server:update:selected', {
      url: origin,
      meta: operationMeta,
    })
  }

  // Wait for the server selection to be processed before updating the path
  await nextTick()

  // Update the path immediately without debouncing
  // This ensures clean UX when pasting a full URL
  emitPathMethodUpdate(methodConflict.value ?? method, normalizedPath)
}

/**
 * Handle clearing/unsetting the server selection
 */
const handleClearServer = (): void => {
  eventBus.emit('server:update:selected', {
    url: '',
    meta: serverMeta,
  })
}

/**
 * Handle backspace at position 0 to clear the server
 * Returns true if the event was handled, false otherwise
 */
const handleBackspaceAtStart = (): boolean => {
  if (!server) {
    return false
  }

  const cursorPos = addressBarRef.value?.cursorPosition() ?? 0
  if (cursorPos === 0) {
    handleClearServer()
    return true
  }
  return false
}

/**
 * Handle keydown event for backspace key
 */
const handleBackspaceKeydown = (event: KeyboardEvent): void => {
  // Check if backspace is at position 0 with a server selected
  if (handleBackspaceAtStart()) {
    event.preventDefault()
    event.stopPropagation()
  }
}

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

/** Update the operation's path, handling conflicts and full URL pasting */
const handlePathChange = (newPath: string): void => {
  const oldPath = previousPathValue.value
  previousPathValue.value = newPath

  // Check if this is a full URL being PASTED (not typed character by character)
  // We only handle full URLs when they're pasted to avoid awkward interactions
  if (isFullUrl(newPath) && isPasteOperation(oldPath, newPath)) {
    handleFullUrlInput(newPath)
    return
  }

  // Check if the entire content was cleared (ctrl+a+delete or select all + backspace)
  if (newPath === '' && server) {
    handleClearServer()
    return
  }

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

const navigateToServersPage = () => {
  if (serverMeta.type === 'operation') {
    return eventBus.emit('ui:navigate', {
      page: 'operation',
      path: 'servers',
      operationPath: serverMeta.path,
      method: serverMeta.method,
    })
  }
  return eventBus.emit('ui:navigate', {
    page: 'document',
    path: 'servers',
  })
}

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
        class="scroll-timeline-x scroll-timeline-x-hidden relative flex w-full bg-blend-normal"
        @keydown.backspace.capture="handleBackspaceKeydown">
        <!-- Servers -->
        <ServerDropdown
          v-if="servers.length"
          :layout="layout"
          :meta="serverMeta"
          :server="server"
          :servers="servers"
          :target="id"
          @update:open="(value) => (isServerDropdownOpen = value)"
          @update:selectedServer="
            (payload) => eventBus.emit('server:update:selected', payload)
          "
          @update:servers="navigateToServersPage"
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
