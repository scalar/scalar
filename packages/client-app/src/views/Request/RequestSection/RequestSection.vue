<script setup lang="ts">
import ContextBar from '@/components/ContextBar.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useWorkspace } from '@/store/workspace'
import RequestAuth from '@/views/Request/RequestSection/RequestAuth.vue'
import RequestBody from '@/views/Request/RequestSection/RequestBody.vue'
import RequestParams from '@/views/Request/RequestSection/RequestParams.vue'
import RequestPathParams from '@/views/Request/RequestSection/RequestPathParams.vue'
import { ScalarIcon } from '@scalar/components'
import { computed, ref, watch } from 'vue'

const { activeRequest, activeExample } = useWorkspace()

const bodyMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

const sections = computed(() => {
  const allSections = [
    'All',
    'Auth',
    'Request',
    'Cookies',
    'Headers',
    'Query',
    'Body',
  ]

  if (!activeExample.value.parameters.path.length) {
    allSections.splice(allSections.indexOf('Request'), 1)
  }

  if (!bodyMethods.includes(activeRequest.value.method)) {
    allSections.splice(allSections.indexOf('Body'), 1)
  }
  return allSections
})

type ActiveSections = (typeof sections.value)[number]

const activeSection = ref<ActiveSections>('All')

watch(activeRequest, (newRequest) => {
  if (
    activeSection.value === 'Body' &&
    !bodyMethods.includes(newRequest.method)
  ) {
    activeSection.value = 'All'
  }
})
</script>
<template>
  <ViewLayoutSection>
    <template #title>
      <ScalarIcon
        class="text-c-3 mr-1.5"
        icon="ExternalLink"
        size="sm" />
      <div class="flex-1">
        Request
        <span class="text-c-3 pl-1">{{ activeRequest?.summary }}</span>
      </div>
    </template>
    <div
      class="request-section-content custom-scroll flex flex-1 flex-col px-2 xl:px-5 py-2.5">
      <ContextBar
        :activeSection="activeSection"
        :sections="sections"
        @setActiveSection="activeSection = $event" />
      <RequestAuth
        v-show="activeSection === 'All' || activeSection === 'Auth'"
        title="Authentication" />
      <RequestPathParams
        v-show="
          (activeSection === 'All' || activeSection === 'Request') &&
          activeExample.parameters.path.length > 0
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
          (activeSection === 'All' || activeSection === 'Body') &&
          bodyMethods.includes(activeRequest.method)
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
