<script lang="ts">
/**
 * WebSocket connection bar — mirrors HTTP AddressBar layout:
 * [Action | Server base | Path/address | Copy | Connect]
 */
export default {
  name: 'ConnectionBar',
}
</script>

<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarIcon } from '@scalar/components/icon'
import { ScalarIconCopy } from '@scalar/icons'
import { EditorView } from '@scalar/use-codemirror'
import type { AsyncApiServerEntry } from '@scalar/workspace-store/channel-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed, ref, useId } from 'vue'

import {
  mergeConnectionUrl,
  splitConnectionUrl,
} from '@/v2/blocks/channel-operation-block/helpers/connection-bar-url'
import type { WebSocketSessionState } from '@/v2/blocks/channel-operation-block/helpers/websocket-session'
import { useLoadingAnimation } from '@/v2/blocks/scalar-address-bar-block/hooks/use-loading-animation'
import { CodeInput } from '@/v2/components/code-input'
import type { ClientLayout } from '@/v2/types/layout'

import AsyncApiServerDropdown from './AsyncApiServerDropdown.vue'
import WebSocketProtocolBadge from './WebSocketProtocolBadge.vue'

const {
  connectionUrl,
  environment,
  layout,
  selectedServer,
  servers,
  sessionState,
} = defineProps<{
  /** Resolved WebSocket connection URL */
  connectionUrl: string
  /** Environment variables for URL substitution display */
  environment: XScalarEnvironment
  /** Client layout */
  layout: ClientLayout
  /** Available servers */
  servers: AsyncApiServerEntry[]
  /** Selected server */
  selectedServer: AsyncApiServerEntry | null
  /** Current WebSocket session state */
  sessionState: WebSocketSessionState
}>()

const emit = defineEmits<{
  (e: 'connect'): void
  (e: 'disconnect'): void
  (e: 'copy:url'): void
  (e: 'update:connectionUrl', value: string): void
  (e: 'select:server', serverName: string): void
}>()

const id = useId()
const isServerDropdownOpen = ref(false)

const { percentage, startLoading, stopLoading, isLoading } =
  useLoadingAnimation()

const isConnected = computed(() => sessionState === 'open')
const isConnecting = computed(() => sessionState === 'connecting')
const canDisconnect = computed(
  () =>
    sessionState === 'open' ||
    sessionState === 'connecting' ||
    sessionState === 'closing',
)

const serverBaseUrl = computed(() => selectedServer?.url ?? '')

const connectionPath = computed(
  () => splitConnectionUrl(connectionUrl, serverBaseUrl.value).path,
)

const addressBarAccentVar = 'var(--scalar-color-purple)'

const addressBarScrollMargins = EditorView.scrollMargins.of(() => ({
  right: 24,
}))

const style = computed(() => ({
  backgroundColor: `color-mix(in srgb, transparent 90%, ${addressBarAccentVar})`,
  transform: `translate3d(-${percentage.value}%,0,0)`,
}))

const connectLabel = computed(() => {
  if (canDisconnect.value) {
    return isConnected.value ? 'Disconnect' : 'Cancel'
  }
  return 'Connect'
})

const handlePathUpdate = (path: string): void => {
  emit('update:connectionUrl', mergeConnectionUrl(serverBaseUrl.value, path))
}

const handleConnectClick = (): void => {
  if (canDisconnect.value) {
    emit('disconnect')
    return
  }

  startLoading()
  emit('connect')
}

defineExpose({
  startLoading,
  stopLoading,
})
</script>

<template>
  <div
    class="order-last flex h-auto w-full max-w-3xl grow-3 flex-wrap items-stretch [--scalar-address-bar-height:32px] @3xl:order-0 @3xl:flex-nowrap">
    <div
      :id="id"
      class="address-bar-bg-states text-xxs group relative flex h-(--scalar-address-bar-height) w-full flex-1 flex-row items-stretch rounded-lg p-0.75"
      :class="{ 'rounded-b-none': isServerDropdownOpen }">
      <div
        class="pointer-events-none absolute top-0 left-0 block h-full w-full overflow-hidden rounded-lg border"
        :class="{ 'rounded-b-none': isServerDropdownOpen }">
        <div
          class="absolute top-0 left-0 h-full w-full"
          :style />
      </div>

      <div class="relative z-10 flex h-full min-w-0 flex-1 items-center">
        <div class="hidden shrink-0 @3xl:flex">
          <WebSocketProtocolBadge />
        </div>

        <AsyncApiServerDropdown
          v-if="servers.length"
          class="shrink-0 self-center"
          :selectedServer="selectedServer"
          :servers="servers"
          :target="id"
          @select:server="
            (name) => {
              isServerDropdownOpen = false
              emit('select:server', name)
            }
          "
          @update:open="(value) => (isServerDropdownOpen = value)" />

        <div
          class="channel-connection-path scroll-timeline-x scroll-timeline-x-address scroll-timeline-x-hidden relative flex h-full min-w-0 flex-1 items-center bg-blend-normal">
          <CodeInput
            alwaysEmitChange
            aria-label="Connection path"
            class="ml-1 h-full w-full min-w-0 pl-px leading-[27px] outline-none"
            disableCloseBrackets
            :disabled="layout === 'modal'"
            disableEnter
            disableTabIndent
            :emitOnBlur="false"
            :environment="environment"
            :extensions="[addressBarScrollMargins]"
            :layout="layout"
            :modelValue="connectionPath"
            :placeholder="
              serverBaseUrl ? 'Channel path or query' : 'Enter a WebSocket URL'
            "
            @update:modelValue="handlePathUpdate" />
        </div>
      </div>

      <ScalarButton
        class="hover:bg-b-3 mx-1 hidden @3xl:flex"
        size="xs"
        variant="ghost"
        @click="emit('copy:url')">
        <ScalarIconCopy />
        <span class="sr-only">Copy connection URL</span>
      </ScalarButton>

      <ScalarButton
        class="relative hidden h-auto shrink-0 overflow-hidden py-1 pr-2.5 pl-2 font-bold @3xl:flex"
        data-addressbar-action="connect"
        :disabled="isLoading && isConnecting"
        @click="handleConnectClick">
        <span
          aria-hidden="true"
          class="inline-flex items-center gap-1">
          <ScalarIcon
            v-if="!canDisconnect"
            class="relative shrink-0 fill-current"
            icon="Play"
            size="xs" />
          <ScalarIcon
            v-else
            class="relative shrink-0 fill-current"
            icon="Close"
            size="xs" />
          <span class="text-xxs flex">{{ connectLabel }}</span>
        </span>
        <span class="sr-only">
          {{ connectLabel }} WebSocket connection to {{ connectionUrl }}
        </span>
      </ScalarButton>
    </div>

    <div
      class="mt-2 flex h-(--scalar-address-bar-height) w-full min-w-0 items-stretch gap-1 @3xl:hidden">
      <WebSocketProtocolBadge />
      <AsyncApiServerDropdown
        v-if="servers.length"
        class="min-w-0 shrink-0"
        :selectedServer="selectedServer"
        :servers="servers"
        :target="id"
        @select:server="
          (name) => {
            isServerDropdownOpen = false
            emit('select:server', name)
          }
        "
        @update:open="(value) => (isServerDropdownOpen = value)" />
      <ScalarButton
        class="hover:bg-b-3 ml-auto"
        size="xs"
        variant="ghost"
        @click="emit('copy:url')">
        <ScalarIconCopy />
        <span class="sr-only">Copy connection URL</span>
      </ScalarButton>
      <ScalarButton
        class="relative h-auto shrink-0 overflow-hidden py-1 pr-2.5 pl-2 font-bold"
        data-addressbar-action="connect"
        :disabled="isLoading && isConnecting"
        @click="handleConnectClick">
        <span
          aria-hidden="true"
          class="inline-flex items-center gap-1">
          <ScalarIcon
            v-if="!canDisconnect"
            class="relative shrink-0 fill-current"
            icon="Play"
            size="xs" />
          <ScalarIcon
            v-else
            class="relative shrink-0 fill-current"
            icon="Close"
            size="xs" />
          <span class="text-xxs">{{ connectLabel }}</span>
        </span>
      </ScalarButton>
    </div>
  </div>
</template>

<style scoped>
/* Override CodeInput defaults (max-height / padding) so path text aligns with the server control. */
.channel-connection-path :deep(.cm-editor) {
  height: 100%;
  outline: none;
  width: 100%;
}
.channel-connection-path :deep(.cm-line) {
  padding: 0;
}
.channel-connection-path :deep(.cm-content) {
  padding: 0;
  max-height: none;
  display: flex;
  align-items: center;
  font-size: var(--scalar-small);
  line-height: 27px;
}
.channel-connection-path :deep(.cm-scroller) {
  display: flex;
  align-items: center;
  min-height: 100%;
}
.channel-connection-path :deep(> div) {
  display: flex;
  height: 100%;
  align-items: center;
}
.scroll-timeline-x-address {
  line-height: 27px;
  scrollbar-width: none;
}
/* Fade only the path field on the right — server control sits outside this mask. */
.channel-connection-path.scroll-timeline-x {
  -ms-overflow-style: none;
  mask-image: linear-gradient(
    to right,
    black 0,
    black calc(100% - 24px),
    transparent 100%
  );
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
</style>
