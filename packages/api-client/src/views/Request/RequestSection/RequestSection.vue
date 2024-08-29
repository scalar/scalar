<script setup lang="ts">
import ContextBar from '@/components/ContextBar.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useWorkspace } from '@/store'
import RequestAuth from '@/views/Request/RequestSection/RequestAuth.vue'
import RequestBody from '@/views/Request/RequestSection/RequestBody.vue'
import RequestParams from '@/views/Request/RequestSection/RequestParams.vue'
import RequestPathParams from '@/views/Request/RequestSection/RequestPathParams.vue'
import { ScalarIcon } from '@scalar/components'
import { computed, ref, watch } from 'vue'

const {
  activeRequest,
  activeExample,
  activeEnvVariables,
  isReadOnly,
  requestMutators,
} = useWorkspace()

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

  if (isAuthHidden.value) allSections.splice(allSections.indexOf('Auth'), 1)

  return allSections
})

// If security = [] or [{}] just hide it on readOnly mode
const isAuthHidden = computed(
  () =>
    isReadOnly.value &&
    (activeSecurityRequirements.value.length === 0 ||
      JSON.stringify(activeSecurityRequirements.value) === '[{}]'),
)

type ActiveSections = (typeof sections.value)[number]

const activeSection = ref<ActiveSections>('All')

watch(activeRequest, (newRequest) => {
  if (
    activeSection.value === 'Body' &&
    newRequest &&
    !bodyMethods.includes(newRequest.method)
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
      <div class="flex-1 flex items-center pointer-events-none">
        Request
        <label
          v-if="!isReadOnly"
          class="absolute w-full h-full top-0 left-0 pointer-events-auto opacity-0 cursor-text"
          for="requestname"></label>
        <input
          id="requestname"
          class="pl-1 outline-none border-0 text-c-2 rounded pointer-events-auto relative w-full"
          :disabled="isReadOnly"
          placeholder="Request Name"
          :value="activeRequest?.summary"
          @input="updateRequestNameHandler" />
      </div>
    </template>
    <div
      class="request-section-content custom-scroll flex flex-1 flex-col px-2 xl:px-5 py-2.5">
      <ContextBar
        :activeSection="activeSection"
        :sections="sections"
        @setActiveSection="activeSection = $event" />
      <!-- <RequestAuth -->
      <!--   v-show=" -->
      <!--     !isAuthHidden && (activeSection === 'All' || activeSection === 'Auth') -->
      <!--   " -->
      <!--   :index="0" -->
      <!--   :securityScheme="activeSecuritySchemes[0]" -->
      <!--   title="Authentication" /> -->
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
