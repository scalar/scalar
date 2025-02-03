<script setup lang="ts">
import ContextBar from '@/components/ContextBar.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useLayout } from '@/hooks'
import { matchesDomain } from '@/libs/send-request/set-request-cookies'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import RequestBody from '@/views/Request/RequestSection/RequestBody.vue'
import RequestParams from '@/views/Request/RequestSection/RequestParams.vue'
import RequestPathParams from '@/views/Request/RequestSection/RequestPathParams.vue'
import type { SelectedSecuritySchemeUids } from '@scalar/oas-utils/entities/shared'
import { canMethodHaveBody, isDefined } from '@scalar/oas-utils/helpers'
import { computed, ref, watch } from 'vue'

import RequestAuth from './RequestAuth/RequestAuth.vue'

defineProps<{
  selectedSecuritySchemeUids: SelectedSecuritySchemeUids
}>()

const {
  activeRequest,
  activeCollection,
  activeExample,
  activeWorkspace,
  activeServer,
} = useActiveEntities()
const { requestMutators, cookies, securitySchemes } = useWorkspace()
const { layout } = useLayout()

const sections = computed(() => {
  const allSections = new Set([
    'All',
    'Query',
    'Auth',
    'Variables',
    'Cookies',
    'Headers',
    'Body',
  ])

  if (!activeExample.value?.parameters.path.length)
    allSections.delete('Variables')
  if (!canMethodHaveBody(activeRequest.value?.method ?? 'get'))
    allSections.delete('Body')
  if (isAuthHidden.value) allSections.delete('Auth')

  return [...allSections]
})

// If security = [] or [{}] just hide it on readOnly mode
const isAuthHidden = computed(
  () => layout === 'modal' && activeRequest.value?.security?.length === 0,
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

/**
 * Add the global cookies as static entries to the cookies section
 */
const activeWorkspaceCookies = computed(() =>
  (activeWorkspace.value?.cookies ?? [])
    .map((uid) => cookies[uid])
    .filter(isDefined)
    .filter((cookie) => cookie.name)
    .filter((cookie) =>
      matchesDomain(
        activeServer?.value?.url || activeRequest.value?.path,
        cookie.domain,
      ),
    )
    .map((cookie) => ({
      key: cookie.name,
      value: cookie.value,
      route: {
        name: 'cookies',
        params: {
          cookies: cookie.uid,
        },
      },
      enabled: true,
    })),
)
</script>
<template>
  <ViewLayoutSection :aria-label="`Request: ${activeRequest?.summary}`">
    <template #title>
      <div
        class="flex-1 flex gap-1 items-center lg:pr-24 pointer-events-none group">
        <label
          v-if="layout !== 'modal'"
          class="absolute w-full h-full top-0 left-0 pointer-events-auto opacity-0 cursor-text"
          for="requestname" />
        <input
          v-if="layout !== 'modal'"
          id="requestname"
          class="text-c-1 rounded pointer-events-auto relative w-full pl-1.25 -ml-0.5 md:-ml-1.25 h-8 group-hover-input has-[:focus-visible]:outline z-10"
          placeholder="Request Name"
          :value="activeRequest?.summary"
          @input="updateRequestNameHandler" />
        <span
          v-else
          class="flex items-center text-c-1 h-8">
          {{ activeRequest?.summary }}
        </span>
      </div>
      <ContextBar
        :activeSection="activeSection"
        :sections="sections"
        @setActiveSection="activeSection = $event" />
    </template>
    <div class="request-section-content custom-scroll flex flex-1 flex-col">
      <RequestAuth
        v-if="
          activeCollection &&
          activeWorkspace &&
          (layout !== 'modal' || Object.keys(securitySchemes ?? {}).length)
        "
        v-show="
          !isAuthHidden && (activeSection === 'All' || activeSection === 'Auth')
        "
        :collection="activeCollection"
        layout="client"
        :operation="activeRequest"
        :selectedSecuritySchemeUids="selectedSecuritySchemeUids"
        :server="activeServer"
        title="Authentication"
        :workspace="activeWorkspace" />
      <RequestPathParams
        v-show="
          (activeSection === 'All' || activeSection === 'Variables') &&
          activeExample?.parameters?.path?.length
        "
        paramKey="path"
        title="Variables" />
      <RequestParams
        v-show="activeSection === 'All' || activeSection === 'Cookies'"
        paramKey="cookies"
        :readOnlyEntries="activeWorkspaceCookies"
        title="Cookies"
        workspaceParamKey="cookies" />
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
          activeRequest?.method &&
          (activeSection === 'All' || activeSection === 'Body') &&
          canMethodHaveBody(activeRequest.method)
        "
        title="Body" />
    </div>
  </ViewLayoutSection>
</template>
<style scoped>
.request-section-content {
  --scalar-border-width: 0.5px;
}
.request-section-content-filter {
  box-shadow: 0 -10px 0 10px var(--scalar-background-1);
}
.request-item:focus-within .request-meta-buttons {
  opacity: 1;
}
.group-hover-input {
  border-width: var(--scalar-border-width);
  border-color: transparent;
}
.group:hover .group-hover-input {
  background: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
  border-color: var(--scalar-border-color);
}
.group-hover-input:focus {
  background: transparent !important;
  border-color: var(--scalar-border-color) !important;
}
</style>
