<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { Workspace } from '@scalar/oas-utils/entities'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { SelectedSecuritySchemeUids } from '@scalar/oas-utils/entities/shared'
import type {
  Collection,
  Operation,
  RequestExample,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { canMethodHaveBody, isDefined } from '@scalar/oas-utils/helpers'
import { computed, ref, watch } from 'vue'

import ContextBar from '@/components/ContextBar.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useLayout } from '@/hooks'
import { matchesDomain } from '@/libs/send-request/set-request-cookies'
import { useWorkspace } from '@/store'
import type { EnvVariable } from '@/store/active-entities'
import RequestBody from '@/views/Request/RequestSection/RequestBody.vue'
import RequestParams from '@/views/Request/RequestSection/RequestParams.vue'
import RequestPathParams from '@/views/Request/RequestSection/RequestPathParams.vue'

import RequestAuth from './RequestAuth/RequestAuth.vue'
import RequestCodeExample from './RequestCodeExample.vue'

const {
  collection,
  environment,
  envVariables,
  example,
  operation,
  selectedSecuritySchemeUids,
  server,
  workspace,
} = defineProps<{
  collection: Collection
  environment: Environment
  envVariables: EnvVariable[]
  example: RequestExample
  operation: Operation
  selectedSecuritySchemeUids: SelectedSecuritySchemeUids
  server: Server | undefined
  workspace: Workspace
}>()

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

  if (!example.parameters.path.length) allSections.delete('Variables')
  if (!canMethodHaveBody(operation.method ?? 'get')) allSections.delete('Body')
  if (isAuthHidden.value) allSections.delete('Auth')

  return [...allSections]
})

// If security = [] or [{}] just hide it on readOnly mode
const isAuthHidden = computed(
  () => layout === 'modal' && operation.security?.length === 0,
)

type ActiveSections = (typeof sections.value)[number]

const activeSection = ref<ActiveSections>('All')

watch(
  () => operation,
  (newOperation) => {
    if (
      activeSection.value === 'Body' &&
      newOperation &&
      !canMethodHaveBody(newOperation.method)
    ) {
      activeSection.value = 'All'
    }
  },
)

const updateRequestNameHandler = (event: Event) => {
  const target = event.target as HTMLInputElement
  requestMutators.edit(operation.uid, 'summary', target.value)
}

/**
 * Add the global cookies as static entries to the cookies section
 */
const activeWorkspaceCookies = computed(() =>
  (workspace.cookies ?? [])
    .map((uid) => cookies[uid])
    .filter(isDefined)
    .filter((cookie) => cookie.name)
    .filter((cookie) =>
      matchesDomain(server?.url || operation.path, cookie.domain),
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
  <ViewLayoutSection :aria-label="`Request: ${operation.summary}`">
    <template #title>
      <div
        class="group pointer-events-none flex flex-1 items-center gap-1 lg:pr-24">
        <label
          v-if="layout !== 'modal'"
          class="pointer-events-auto absolute top-0 left-0 h-full w-full cursor-text opacity-0"
          for="requestname" />
        <input
          v-if="layout !== 'modal'"
          id="requestname"
          class="text-c-1 group-hover-input pointer-events-auto relative z-10 -ml-0.5 h-8 w-full rounded pl-1.25 has-[:focus-visible]:outline md:-ml-1.25"
          placeholder="Request Name"
          :value="operation.summary"
          @input="updateRequestNameHandler" />
        <span
          v-else
          class="text-c-1 flex h-8 items-center">
          {{ operation.summary }}
        </span>
      </div>
      <ContextBar
        :activeSection="activeSection"
        :sections="sections"
        @setActiveSection="activeSection = $event" />
    </template>
    <div
      class="request-section-content custom-scroll relative flex flex-1 flex-col divide-y">
      <RequestAuth
        v-if="
          collection &&
          workspace &&
          (layout !== 'modal' || Object.keys(securitySchemes ?? {}).length)
        "
        v-show="
          !isAuthHidden && (activeSection === 'All' || activeSection === 'Auth')
        "
        :collection="collection"
        :envVariables="envVariables"
        :environment="environment"
        layout="client"
        :operation="operation"
        :selectedSecuritySchemeUids="selectedSecuritySchemeUids"
        :server="server"
        title="Authentication"
        :workspace="workspace" />
      <RequestPathParams
        v-show="
          (activeSection === 'All' || activeSection === 'Variables') &&
          example.parameters.path.length
        "
        :envVariables="envVariables"
        :environment="environment"
        :example="example"
        :operation="operation"
        paramKey="path"
        title="Variables"
        :workspace="workspace" />
      <RequestParams
        v-show="activeSection === 'All' || activeSection === 'Cookies'"
        :envVariables="envVariables"
        :environment="environment"
        :example="example"
        :operation="operation"
        paramKey="cookies"
        :readOnlyEntries="activeWorkspaceCookies"
        title="Cookies"
        :workspace="workspace"
        workspaceParamKey="cookies" />
      <RequestParams
        v-show="activeSection === 'All' || activeSection === 'Headers'"
        :envVariables="envVariables"
        :environment="environment"
        :example="example"
        :operation="operation"
        paramKey="headers"
        title="Headers"
        :workspace="workspace" />
      <RequestParams
        v-show="activeSection === 'All' || activeSection === 'Query'"
        :envVariables="envVariables"
        :environment="environment"
        :example="example"
        :operation="operation"
        paramKey="query"
        title="Query Parameters"
        :workspace="workspace" />
      <RequestBody
        v-show="
          operation.method &&
          (activeSection === 'All' || activeSection === 'Body') &&
          canMethodHaveBody(operation.method)
        "
        :envVariables="envVariables"
        :environment="environment"
        :example="example"
        :operation="operation"
        title="Body"
        :workspace="workspace" />

      <!-- Spacer -->
      <div class="-my-0.25 flex flex-grow" />

      <!-- Code Snippet -->
      <ScalarErrorBoundary>
        <RequestCodeExample
          :collection="collection"
          :example="example"
          :operation="operation"
          :server="server"
          :workspace="workspace" />
      </ScalarErrorBoundary>
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
