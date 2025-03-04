<script setup lang="ts">
import { isDefined } from '@scalar/oas-utils/helpers'
import { safeJSON } from '@scalar/object-utils/parse'
import { useToasts } from '@scalar/use-toasts'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterView } from 'vue-router'

import SidebarToggle from '@/components/Sidebar/SidebarToggle.vue'
import { useLayout } from '@/hooks'
import { useSidebar } from '@/hooks/useSidebar'
import { ERRORS } from '@/libs'
import { createRequestOperation } from '@/libs/send-request'
import { validateParameters } from '@/libs/validate-parameters'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { useOpenApiWatcher } from '@/views/Request/hooks/useOpenApiWatcher'

import RequestSidebar from './RequestSidebar.vue'

defineEmits<(e: 'newTab', item: { name: string; uid: string }) => void>()
const workspaceContext = useWorkspace()
const { toast } = useToasts()
const { layout } = useLayout()
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
const { isSidebarOpen } = useSidebar()

const requestAbortController = ref<AbortController>()
const invalidParams = ref<Set<string>>(new Set())

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
    (layout === 'modal'
      ? activeCollection.value?.selectedSecuritySchemeUids
      : activeRequest.value?.selectedSecuritySchemeUids) ?? [],
)

/**
 * Execute the request
 * called from the send button as well as keyboard shortcuts
 */
const executeRequest = async () => {
  if (!activeRequest.value || !activeExample.value || !activeCollection.value)
    return

  invalidParams.value = validateParameters(activeExample.value)

  const environmentValue =
    typeof activeEnvironment.value === 'object'
      ? activeEnvironment.value.value
      : '{}'
  const e = safeJSON.parse(environmentValue)
  if (e.error) console.error('INVALID ENVIRONMENT!')
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
  })

  // Error from createRequestOperation
  if (error) {
    toast(error.message, 'error')
    return
  }

  requestAbortController.value = requestOperation.controller
  const [sendRequestError, result] = await requestOperation.sendRequest()

  // Send error toast
  if (sendRequestError) toast(sendRequestError.message, 'error')
  // we need to deep clone the result because it's a ref and updates will break the history
  else requestHistory.push(JSON.parse(JSON.stringify(result)))
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
</script>

<template>
  <!-- Layout -->
  <div
    class="bg-b-1 relative z-0 flex h-full flex-1 flex-col overflow-hidden pt-0"
    :class="{
      '!mb-0 !mr-0 !border-0': layout === 'modal',
    }">
    <SidebarToggle
      v-if="showSidebar"
      v-model="isSidebarOpen"
      class="absolute left-3 top-2 z-50"
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
        <RouterView :invalidParams="invalidParams" />
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
