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
  /** Openapi document slug */
  documentSlug: string
  /** Currently selected example key for the current operation */
  exampleKey: string
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
import { getSelector } from '@scalar/helpers/dom/get-selector'
import { REQUEST_METHODS } from '@scalar/helpers/http/http-info'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { extractServerFromPath } from '@scalar/helpers/url/extract-server-from-path'
import { ScalarIconCopy, ScalarIconWarningCircle } from '@scalar/icons'
import { EditorView } from '@scalar/use-codemirror'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import type {
  ApiReferenceEvents,
  ServerMeta,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import {
  getEnvironmentVariables,
  getResolvedUrl,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useTemplateRef,
  watch,
} from 'vue'

import { HttpMethod } from '@/components/HttpMethod'
import { getOperationExampleKey } from '@/v2/blocks/operation-block/helpers/response-cache'
import { isPlaceholderPath } from '@/v2/blocks/scalar-address-bar-block/helpers/is-placeholder-path'
import { refocusBlurTarget } from '@/v2/blocks/scalar-address-bar-block/helpers/refocus-blur-target'
import { useLoadingAnimation } from '@/v2/blocks/scalar-address-bar-block/hooks/use-loading-animation'
import { usePathMasking } from '@/v2/blocks/scalar-address-bar-block/hooks/use-path-masking'
import { CodeInput } from '@/v2/components/code-input'
import { ServerDropdown } from '@/v2/components/server'
import type { ClientLayout } from '@/v2/types/layout'

import AddressBarHistory, { type History } from './AddressBarHistory.vue'

const {
  path,
  method,
  layout,
  eventBus,
  exampleKey,
  documentSlug,
  server,
  servers,
  environment,
  serverMeta,
} = defineProps<AddressBarProps>()

const emit = defineEmits<{
  /** Execute the current operation example */
  (e: 'execute'): void
  /** Select a request history item by index */
  (e: 'select:history:item', payload: { index: number }): void
}>()

// ───────────────────────────────────────────────────────────────────
// Template refs & reactive state
// ───────────────────────────────────────────────────────────────────

const id = useId()
const sendButtonRef = useTemplateRef('sendButtonRef')
const addressBarRef = useTemplateRef('addressBarRef')

const { percentage, startLoading, stopLoading, isLoading } =
  useLoadingAnimation()

const pathConflict = ref<string | null>(null)
const methodConflict = ref<HttpMethodType | null>(null)
const tabbedOut = ref(false)
const isServerDropdownOpen = ref(false)
const isHistoryDropdownOpen = ref(false)

// ───────────────────────────────────────────────────────────────────
// Derived state
// ───────────────────────────────────────────────────────────────────

/** Keeps the cursor visible past the fade-right overlay while typing */
const addressBarScrollMargins = EditorView.scrollMargins.of(() => ({
  right: 24,
}))

/** Animated background transform for the loading indicator */
const style = computed(() => ({
  backgroundColor: `color-mix(in srgb, transparent 90%, ${REQUEST_METHODS[method].colorVar})`,
  transform: `translate3d(-${percentage.value}%,0,0)`,
}))

/** Whether there is a path or method conflict */
const hasConflict = computed(() => methodConflict.value || pathConflict.value)

/** Whether either dropdown (server or history) is open */
const isDropdownOpen = computed(
  () => isServerDropdownOpen.value || isHistoryDropdownOpen.value,
)

/** Uniquely identifies the currently selected operation + example */
const uniqueKey = computed(() =>
  getOperationExampleKey(method, path, exampleKey, documentSlug),
)

/** Clear conflict state when switching to a different operation */
watch(uniqueKey, () => {
  pathConflict.value = null
  methodConflict.value = null
})

// ───────────────────────────────────────────────────────────────────
// Focus helpers
// ───────────────────────────────────────────────────────────────────

const handleFocusSendButton = (): void => sendButtonRef.value?.$el?.focus()

const handleFocusAddressBar = (
  payload: ApiReferenceEvents['ui:focus:address-bar'],
): void => {
  // On non-desktop layouts, if already focused we let the browser handle the
  // native behavior (e.g. selecting the browser's own address bar).
  if (addressBarRef.value?.isFocused && layout !== 'desktop') {
    return
  }

  addressBarRef.value?.focus('end')

  if (payload && 'clear' in payload && payload.clear) {
    addressBarRef.value?.setCodeMirrorContent('')
  }

  if (payload && 'event' in payload) {
    payload.event.preventDefault()
  }
}

// ───────────────────────────────────────────────────────────────────
// Path masking
//
// Drafts on `/` and auto-generated `/_scalar_temp...` paths are internal
// placeholders — the address bar focuses and clears on mount and on
// navigation so the user sees a blank prompt instead of the internal
// path. Local edits are skipped via `markLocalEdit` so that blurring
// away from a typed path does not re-focus the input.
// ───────────────────────────────────────────────────────────────────

const { beginLocalEdit, endLocalEdit } = usePathMasking({
  isReady: () => addressBarRef.value?.codeMirror,
  operationKey: () => uniqueKey.value,
  shouldMask: () => isPlaceholderPath(path, documentSlug),
  onMask: () => handleFocusAddressBar({ clear: true }),
})

// ───────────────────────────────────────────────────────────────────
// Server extraction
// ───────────────────────────────────────────────────────────────────

/** If the path contains a server URL, extract it and select or add that server */
const extractAndSelectServer = (targetPath: string): string => {
  const extracted = extractServerFromPath(targetPath)
  if (!extracted) {
    return targetPath
  }

  const [url, remainingPath] = extracted

  // Server is already selected — nothing to do
  if (url === server?.url) {
    return remainingPath
  }

  const matchingServer = servers.find((s) => s.url === url)
  if (matchingServer) {
    eventBus.emit('server:update:selected', { url, meta: serverMeta })
  } else {
    eventBus.emit('server:add:server', {
      url,
      select: true,
      meta: { type: 'operation', path, method },
    })
  }

  return remainingPath
}

// ───────────────────────────────────────────────────────────────────
// Path / method updates
// ───────────────────────────────────────────────────────────────────

const normalizePath = (value: string): string =>
  value.startsWith('/') ? value : `/${value}`

/** Emit a path/method update and reconcile conflicts + cursor state on the result */
const emitPathMethodUpdate = (
  targetMethod: HttpMethodType,
  targetPath: string,
  blurTargetSelector: string | null = null,
): void => {
  const extractedPath = extractAndSelectServer(targetPath)
  const normalizedPath = normalizePath(extractedPath)

  // Keep CodeMirror in sync so a conflict does not leave a stale value on screen
  addressBarRef.value?.setCodeMirrorContent(normalizedPath)

  // Tell the masking watcher that the next `uniqueKey` change (if any) was
  // user-initiated; `endLocalEdit` in the callback reconciles the flag.
  beginLocalEdit()

  eventBus.emit('operation:update:pathMethod', {
    meta: { method, path },
    blurTargetSelector,
    payload: { method: targetMethod, path: normalizedPath },
    callback: (status, returnedSelector) => {
      // Only 'success' mutates the document (and therefore fires the masking
      // watcher). For 'conflict' and 'no-change' we clear the flag now so it
      // does not leak into the next legitimate navigation.
      endLocalEdit(status === 'success')

      if (status === 'success' || status === 'no-change') {
        methodConflict.value = null
        pathConflict.value = null
      } else if (status === 'conflict') {
        if (targetMethod !== method) {
          methodConflict.value = targetMethod
        }
        if (normalizedPath !== path) {
          pathConflict.value = normalizedPath
        }
      }

      // Edge case: pasting a full URL extracts the server but leaves the path
      // unchanged. CodeMirror still shows the full URL, so force it back to
      // just the path.
      const mirrorContent = addressBarRef.value?.codeMirrorRef?.textContent
      if (
        status === 'no-change' &&
        mirrorContent &&
        mirrorContent !== extractedPath
      ) {
        addressBarRef.value?.setCodeMirrorContent(extractedPath)
      }

      refocusBlurTarget(returnedSelector)
    },
  })
}

/** Change the operation's method, preferring the conflicting path if present */
const handleMethodChange = (newMethod: HttpMethodType): void =>
  emitPathMethodUpdate(newMethod, pathConflict.value ?? path)

/**
 * Save the path on blur and replay the click that caused the blur (so e.g. a
 * click on the Send button still fires after the async update resolves).
 * Tab-outs explicitly do not replay — tabbing to a button should not trigger
 * its click.
 */
const handlePathBlur = (newPath: string, event: FocusEvent): void => {
  const relatedTarget = event.relatedTarget as Element | null
  const blurTargetSelector = tabbedOut.value ? null : getSelector(relatedTarget)
  tabbedOut.value = false

  emitPathMethodUpdate(
    methodConflict.value ?? method,
    newPath,
    blurTargetSelector,
  )
}

/** Save the path on Enter and trigger the Send button after the update resolves */
const handlePathSubmit = (
  newPath: string,
  event: KeyboardEvent | FocusEvent,
): void => {
  // Prevent the global hotkey listener from also handling this Enter press
  event.stopPropagation()

  emitPathMethodUpdate(
    methodConflict.value ?? method,
    newPath,
    '[data-addressbar-action="send"]',
  )
}

/** Unset the server when backspace is pressed on an empty path */
const handlePathBackspace = (event: KeyboardEvent): void => {
  if ((event.target as HTMLElement)?.innerText === '\n') {
    eventBus.emit('server:update:selected', { url: '', meta: serverMeta })
  }
}

// ───────────────────────────────────────────────────────────────────
// Clipboard
// ───────────────────────────────────────────────────────────────────

const { copyToClipboard } = useClipboard()

/** Copy the fully resolved URL (with environment variables applied) */
const copyUrl = async (): Promise<void> => {
  const resolvedUrl = getResolvedUrl({ server, path })
  const variables = getEnvironmentVariables(environment)
  await copyToClipboard(replaceEnvVariables(resolvedUrl, variables))
}

// ───────────────────────────────────────────────────────────────────
// Navigation
// ───────────────────────────────────────────────────────────────────

const navigateToServersPage = (): void => {
  if (serverMeta.type === 'operation') {
    eventBus.emit('ui:navigate', {
      page: 'operation',
      path: 'servers',
      operationPath: serverMeta.path,
      method: serverMeta.method,
    })
    return
  }

  eventBus.emit('ui:navigate', { page: 'document', path: 'servers' })
}

// ───────────────────────────────────────────────────────────────────
// Lifecycle
// ───────────────────────────────────────────────────────────────────

let unsubscribes: Array<() => void> = []

onMounted(() => {
  unsubscribes = [
    eventBus.on('ui:focus:address-bar', handleFocusAddressBar),
    eventBus.on('ui:focus:send-button', handleFocusSendButton),
    eventBus.on('copy-url:address-bar', copyUrl),
    eventBus.on('hooks:on:request:sent', startLoading),
    eventBus.on('hooks:on:request:complete', stopLoading),
  ]
})

onBeforeUnmount(() => {
  for (const unsubscribe of unsubscribes) {
    unsubscribe()
  }

  // Prevents the loading animation from continuing after unmount
  stopLoading()
})

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
          class="min-w-fit pl-px outline-none"
          disableCloseBrackets
          :disabled="layout === 'modal'"
          disableEnter
          disableTabIndent
          :emitOnBlur="false"
          :environment="environment"
          :extensions="[addressBarScrollMargins]"
          importCurl
          :layout="layout"
          :modelValue="path"
          :placeholder="server ? '' : 'Enter a URL'"
          server
          @blur="handlePathBlur"
          @keydown.delete="handlePathBackspace"
          @keydown.tab="tabbedOut = true"
          @submit="handlePathSubmit" />
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
        class="z-context absolute inset-x-0 top-[calc(100%+4px)] flex flex-col items-center rounded px-6">
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
        data-addressbar-action="send"
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
