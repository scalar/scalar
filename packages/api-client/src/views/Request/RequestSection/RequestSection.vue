<script setup lang="ts">
import ContextBar from '@/components/ContextBar.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useWorkspace } from '@/store'
import RequestBody from '@/views/Request/RequestSection/RequestBody.vue'
import RequestParams from '@/views/Request/RequestSection/RequestParams.vue'
import RequestPathParams from '@/views/Request/RequestSection/RequestPathParams.vue'
import { ScalarIcon } from '@scalar/components'
import { canMethodHaveBody } from '@scalar/oas-utils/helpers'
import { computed, ref, watch } from 'vue'

import RequestAuth from './RequestAuth/RequestAuth.vue'

const { activeRequest, activeExample, isReadOnly, requestMutators } =
  useWorkspace()

const sections = computed(() => {
  const allSections = new Set([
    'Query',
    'Auth',
    'Request',
    'Cookies',
    'Headers',
    'Body',
    'All',
  ])

  if (!activeExample.value?.parameters.path.length)
    allSections.delete('Request')
  if (!canMethodHaveBody(activeRequest.value?.method ?? 'get'))
    allSections.delete('Body')
  if (isAuthHidden.value) allSections.delete('Auth')

  return [...allSections]
})

// If security = [] or [{}] just hide it on readOnly mode
const isAuthHidden = computed(
  () => isReadOnly.value && activeRequest.value?.security?.length === 0,
)

type ActiveSections = (typeof sections.value)[number]

const activeSection = ref<ActiveSections>('All')

watch(activeRequest, (newRequest) => {
  if (
    activeSection.value === 'Body' &&
    newRequest &&
    !canMethodHaveBody(newRequest.method)
  ) {
    activeSection.value = 'All'
  }
})

const updateRequestNameHandler = (event: Event) => {
  if (!activeRequest.value) return

  const target = event.target as HTMLInputElement
  requestMutators.edit(activeRequest.value.uid, 'summary', target.value)
}
</script>
<template>
  <ViewLayoutSection>
    <template #title>
      <ScalarIcon
        class="text-c-3 mr-2 pointer-events-none"
        icon="ExternalLink"
        size="sm"
        thickness="2.5" />
      <div class="flex-1 flex gap-1 items-center pointer-events-none">
        Request
        <label
          v-if="!isReadOnly"
          class="absolute w-full h-full top-0 left-0 pointer-events-auto opacity-0 cursor-text"
          for="requestname"></label>
        <input
          v-if="!isReadOnly"
          id="requestname"
          class="outline-none border-0 text-c-2 rounded pointer-events-auto relative w-full"
          placeholder="Request Name"
          :value="activeRequest?.summary"
          @input="updateRequestNameHandler" />
        <span
          v-else
          class="text-c-2">
          {{ activeRequest?.summary }}
        </span>
      </div>
      <ContextBar
        :activeSection="activeSection"
        :sections="sections"
        @setActiveSection="activeSection = $event" />
    </template>
    <div
      class="request-section-content custom-scroll flex flex-1 flex-col px-2 xl:px-5 py-2.5">
      <RequestAuth
        v-show="
          !isAuthHidden && (activeSection === 'All' || activeSection === 'Auth')
        "
        title="Authentication" />
      <RequestPathParams
        v-show="
          (activeSection === 'All' || activeSection === 'Request') &&
          activeExample?.parameters?.path?.length
        "
        paramKey="path"
        title="Path Variables" />
      <RequestParams
        v-show="activeSection === 'All' || activeSection === 'Cookies'"
        paramKey="cookies"
        title="Cookies" />
      <RequestParams
        v-show="activeSection === 'All' || activeSection === 'Headers'"
        paramKey="headers"
        title="Headers" />
      <RequestParams
        v-show="activeSection === 'All' || activeSection === 'Query'"
        paramKey="query"
        title="Query Parameters" />
      <RequestBody
        v-show="
          activeRequest &&
          (activeSection === 'All' || activeSection === 'Body') &&
          canMethodHaveBody(activeRequest.method)
        "
        body="foo"
        title="Body" />
    </div>
  </ViewLayoutSection>
</template>
<style>
.request-section-content {
  --scalar-border-width: 0.5px;
}
.request-section-content-filter {
  box-shadow: 0 -10px 0 10px var(--scalar-background-1);
}
.request-item:focus-within .request-meta-buttons {
  opacity: 1;
}
</style>
