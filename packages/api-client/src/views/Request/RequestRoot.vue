<script setup lang="ts">
import { isDefined } from '@scalar/oas-utils/helpers'
import { safeJSON } from '@scalar/object-utils/parse'
import { useToasts } from '@scalar/use-toasts'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterView } from 'vue-router'

import SidebarToggle from '@/components/Sidebar/SidebarToggle.vue'
import { useLayout } from '@/hooks'
import { useClientConfig } from '@/hooks/useClientConfig'
import { useSidebar } from '@/hooks/useSidebar'
import { ERRORS } from '@/libs'
import { createRequestOperation } from '@/libs/send-request'
import type { SendRequestResult } from '@/libs/send-request/create-request-operation'
import { validateParameters } from '@/libs/validate-parameters'
import { usePluginManager } from '@/plugins'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { useOpenApiWatcher } from '@/views/Request/hooks/useOpenApiWatcher'

import RequestSidebar from './RequestSidebar.vue'

defineEmits<(e: 'newTab', item: { name: string; uid: string }) => void>()
const workspaceContext = useWorkspace()
const { toast } = useToasts()
const { layout } = useLayout()
const config = useClientConfig()
const { isSidebarOpen } = useSidebar()

const {
  activeCollection,
  activeExample,
  activeEnvironment,
  activeRequest,
  activeWorkspace,
  activeServer,
} = useActiveEntities()
const { cookies, requestHistory, showSidebar, securitySchemes, events } =
  workspaceContext

const pluginManager = usePluginManager()

const element = ref<HTMLDivElement>()

const requestAbortController = ref<AbortController>()
const invalidParams = ref<Set<string>>(new Set())
const requestResult = ref<SendRequestResult | null>(null)

/**
 * Selected scheme UIDs
 *
 * In the modal we use collection.selectedSecuritySchemes and in the
 * standalone client we use request.selectedSecuritySchemeUids
 *
 * These are centralized here so they can be drilled down AND used in send-request
 */
const selectedSecuritySchemeUids = computed(
  () =>
    (activeCollection.value?.useCollectionSecurity
      ? activeCollection.value?.selectedSecuritySchemeUids
      : activeRequest.value?.selectedSecuritySchemeUids) ?? [],
)

/**
 * Execute the request
 * called from the send button as well as keyboard shortcuts
 */
const executeRequest = async () => {
  if (!activeRequest.value || !activeExample.value || !activeCollection.value) {
    return
  }

  invalidParams.value = validateParameters(activeExample.value)

  const environmentValue =
    typeof activeEnvironment.value === 'object'
      ? activeEnvironment.value.value
      : '{}'
  const e = safeJSON.parse(environmentValue)
  if (e.error) {
    console.error('INVALID ENVIRONMENT!')
  }
  const environment =
    e.error || typeof e.data !== 'object' ? {} : (e.data ?? {})

  const globalCookies =
    activeWorkspace.value?.cookies.map((c) => cookies[c]).filter(isDefined) ??
    []

  const server =
    activeCollection.value?.info?.title === 'Drafts'
      ? undefined
      : activeServer.value

  const [error, requestOperation] = createRequestOperation({
    request: activeRequest.value,
    example: activeExample.value,
    selectedSecuritySchemeUids: selectedSecuritySchemeUids.value,
    proxyUrl: activeWorkspace.value?.proxyUrl ?? '',
    environment,
    globalCookies,
    status: events.requestStatus,
    securitySchemes: securitySchemes,
    server,
    pluginManager,
  })

  // Call the onRequestSent callback if it exists
  config.value?.onRequestSent?.(activeRequest.value.path ?? '')

  // Error from createRequestOperation
  if (error) {
    toast(error.message, 'error')
    return
  }

  requestAbortController.value = requestOperation.controller
  const [sendRequestError, result] = await requestOperation.sendRequest()

  // Store the result to share it with child components
  requestResult.value = result

  // Send error toast
  if (sendRequestError) {
    toast(sendRequestError.message, 'error')
  } else {
    // We need to deep clone the result because it's a ref and updates will break the history
    requestHistory.push(cloneRequestResult(result))
  }
}

/** Cancel a live request */
const cancelRequest = async () =>
  requestAbortController.value?.abort(ERRORS.REQUEST_ABORTED)

onMounted(() => {
  events.executeRequest.on(executeRequest)
  events.cancelRequest.on(cancelRequest)
})

useOpenApiWatcher()

/**
 * Need to manually remove listener on unmount due to vueuse memory leak
 *
 * @see https://github.com/vueuse/vueuse/issues/3498#issuecomment-2055546566
 */
onBeforeUnmount(() => events.executeRequest.off(executeRequest))

// Clear invalid params on parameter update
watch(
  () => activeExample.value?.parameters,
  () => {
    invalidParams.value.clear()
  },
  { deep: true },
)

const cloneRequestResult = (result: any) => {
  // Create a structured clone that can handle Blobs, ArrayBuffers, etc.
  try {
    return structuredClone(result)
  } catch (error) {
    // Fallback to a custom cloning approach if structuredClone fails
    // or isn't available in the environment
    const clone = { ...result }

    // Handle response data specifically
    if (result.response?.data) {
      // If it's a Blob/File/ArrayBuffer, store a reference
      if (
        result.response.data instanceof Blob ||
        result.response.data instanceof ArrayBuffer
      ) {
        clone.response.data = result.response.data
      } else {
        // For regular objects, do a deep clone
        clone.response.data = JSON.parse(JSON.stringify(result.response.data))
      }
    }

    return clone
  }
}
</script>

<template>
  <!-- Layout -->
  <div
    ref="element"
    class="bg-b-1 relative z-0 flex h-full flex-1 flex-col overflow-hidden pt-0"
    :class="{
      '!mr-0 !mb-0 !border-0': layout === 'modal',
    }">
    <SidebarToggle
      v-if="showSidebar"
      v-model="isSidebarOpen"
      class="absolute top-2 left-3 z-50"
      :class="[
        { hidden: isSidebarOpen },
        { 'xl:!flex': !isSidebarOpen },
        { '!flex': layout === 'modal' },
      ]" />
    <div class="flex h-full">
      <!-- Sidebar -->
      <RequestSidebar
        v-if="showSidebar"
        @newTab="$emit('newTab', $event)" />

      <!-- Content -->
      <div class="flex h-full flex-1 flex-col">
        <RouterView
          :invalidParams="invalidParams"
          :selectedSecuritySchemeUids="selectedSecuritySchemeUids"
          :requestResult="requestResult" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.request-text-color-text {
  color: var(--scalar-color-1);
  background: linear-gradient(
    var(--scalar-background-1),
    var(--scalar-background-3)
  );
  box-shadow: 0 0 0 1px var(--scalar-border-color);
}
@media screen and (max-width: 800px) {
  .sidebar-active-hide-layout {
    display: none;
  }
  .sidebar-active-width {
    width: 100%;
  }
}
</style>
