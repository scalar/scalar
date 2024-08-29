<script setup lang="ts">
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import {
  cancelRequestBus,
  executeRequestBus,
  requestStatusBus,
  sendRequest,
} from '@/libs'
import { useWorkspace } from '@/store'
import RequestSection from '@/views/Request/RequestSection/RequestSection.vue'
import RequestSubpageHeader from '@/views/Request/RequestSubpageHeader.vue'
import ResponseSection from '@/views/Request/ResponseSection/ResponseSection.vue'
import { useToasts } from '@scalar/use-toasts'
import { useMediaQuery } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import RequestSidebar from './RequestSidebar.vue'

defineEmits<{
  (e: 'newTab', item: { name: string; uid: string }): void
}>()

const workspaceContext = useWorkspace()
const {
  activeExample,
  activeRequest,
  activeWorkspace,
  activeWorkspaceServers,
  cookies,
  environments,
  modalState,
  requestMutators,
  requestHistory,
} = workspaceContext

const { toast } = useToasts()

const showSideBar = ref(!activeWorkspace.value?.isReadOnly)
const requestAbortController = ref<AbortController>()

const activeHistoryEntry = computed(() =>
  requestHistory.findLast((r) => r.request.uid === activeRequest.value?.uid),
)

/** Show / hide the sidebar when we resize the screen */
const isNarrow = useMediaQuery('(max-width: 780px)')
watch(isNarrow, (narrow) => (showSideBar.value = !narrow))

/**
 * Execute the request
 * called from the send button as well as keyboard shortcuts
 */
const executeRequest = async () => {
  if (!activeRequest.value || !activeExample.value) {
    console.warn(
      'There is no request active at the moment. Please select one then try again.',
    )
    return
  }

  let url = activeExample.value.url

  const variables: Record<string, any> = Object.values(environments).reduce(
    (prev, env) => {
      try {
        return { ...prev, ...JSON.parse(env.raw) }
      } catch {
        return prev
      }
    },
    {},
  )

  const doubleCurlyBrackets = /\{\{(.*?)\}\}/g
  url = url.replace(doubleCurlyBrackets, (_match, key) => {
    // check if a server
    // eslint-disable-next-line consistent-return
    activeWorkspaceServers.value.forEach((server) => {
      if (server.url === key) {
        return key
      }
    })

    return variables[key] || key
  })

  requestStatusBus.emit('start')
  try {
    requestAbortController.value = new AbortController()
    const { request, response, error } = await sendRequest(
      activeRequest.value,
      activeExample.value,
      url,
      activeSecuritySchemes.value,
      activeWorkspace.value?.proxyUrl,
      cookies,
      requestAbortController.value?.signal,
    )

    if (request && response) {
      requestMutators.edit(activeRequest.value.uid, 'history', [
        ...activeRequest.value.history,
        {
          request,
          response,
          timestamp: Date.now(),
        },
      ])
      requestStatusBus.emit('stop')
    } else {
      // Toast if not cancelled by user and we have no response
      if (!(error instanceof DOMException && error.name == 'AbortError'))
        toast(error?.message ?? 'Send Request Failed', 'error')

      requestStatusBus.emit('abort')
    }
  } catch (error) {
    console.error(error)
    toast(`Oops! \n${error}`, 'error')
    requestStatusBus.emit('abort')
  }
}

/** Cancel a live request */
const cancelRequest = async () => requestAbortController.value?.abort()
onMounted(() => {
  executeRequestBus.on(executeRequest)
  cancelRequestBus.on(cancelRequest)
})

/**
 * Need to manually remove listener on unmount due to vueuse memory leak
 *
 * @see https://github.com/vueuse/vueuse/issues/3498#issuecomment-2055546566
 */
onBeforeUnmount(() => {
  executeRequestBus.off(executeRequest)
})
</script>
<template>
  <div
    class="flex flex-1 flex-col rounded pt-0 h-full bg-b-1 relative border-1/2 rounded mr-1.5 mb-1.5 overflow-hidden"
    :class="{
      '!mr-0 !mb-0 !border-0': activeWorkspace.isReadOnly,
    }">
    <RequestSubpageHeader
      v-model="showSideBar"
      :isReadonly="activeWorkspace.isReadOnly"
      @hideModel="() => modalState.hide()" />
    <ViewLayout>
      <RequestSidebar
        :isReadonly="activeWorkspace.isReadOnly"
        :showSidebar="showSideBar"
        @newTab="$emit('newTab', $event)"
        @update:showSidebar="(show) => (showSideBar = show)" />
      <!-- TODO possible loading state -->
      <ViewLayoutContent
        v-if="activeExample"
        class="flex-1"
        :class="[showSideBar ? 'sidebar-active-hide-layout' : '']">
        <RequestSection />
        <ResponseSection :response="activeHistoryEntry?.response" />
      </ViewLayoutContent>
    </ViewLayout>
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
.search-button-fade {
  background: linear-gradient(
    var(--scalar-background-1) 44px,
    color-mix(in srgb, var(--scalar-background-1), transparent) 50px,
    transparent
  );
}
@media screen and (max-width: 780px) {
  .sidebar-active-hide-layout {
    display: none;
  }
  .sidebar-active-width {
    width: 100%;
    border: 1px solid var(--scalar-border-color);
    border-radius: var(--scalar-radius);
  }
}
.gitbook-show {
  display: none;
}
.empty-sidebar-item:deep(.scalar-button) {
  background: var(--scalar-button-1);
  color: var(--scalar-button-1-color);
}
.empty-sidebar-item:deep(.scalar-button:hover) {
  background: var(--scalar-button-1-hover);
}
.empty-sidebar-item:deep(.add-item-hotkey) {
  color: var(--scalar-button-1-color);
  background: color-mix(in srgb, var(--scalar-button-1), white 20%);
  border-color: transparent;
}
</style>
