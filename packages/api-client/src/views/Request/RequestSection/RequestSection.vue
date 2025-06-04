<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { SelectedSecuritySchemeUids } from '@scalar/oas-utils/entities/shared'
import type {
  Collection,
  Operation,
  RequestExample,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { canMethodHaveBody, isDefined, REGEX } from '@scalar/oas-utils/helpers'
import { computed, ref, useId, watch } from 'vue'

import SectionFilter from '@/components/SectionFilter.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useLayout } from '@/hooks'
import { matchesDomain } from '@/libs/send-request/set-request-cookies'
import { usePluginManager } from '@/plugins'
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
  invalidParams: Set<string>
  operation: Operation
  selectedSecuritySchemeUids: SelectedSecuritySchemeUids
  server: Server | undefined
  workspace: Workspace
}>()

const requestSections = [
  'Auth',
  'Variables',
  'Cookies',
  'Headers',
  'Query',
  'Body',
  // 'Scripts',
] as const

type Filter = 'All' | (typeof requestSections)[number]

const { requestMutators, cookies, securitySchemes } = useWorkspace()
const { layout } = useLayout()

const filters = computed<Filter[]>(() => {
  const allSections = new Set<Filter>(['All', ...requestSections])

  if (!example.parameters.path.length) {
    allSections.delete('Variables')
  }
  if (!canMethodHaveBody(operation.method ?? 'get')) {
    allSections.delete('Body')
  }
  if (isAuthHidden.value) {
    allSections.delete('Auth')
  }

  return [...allSections]
})

/** A list of section ids */
const filterIds = computed(
  () =>
    Object.fromEntries(
      filters.value.map((section) => [section, useId()]),
    ) as Record<Filter, string>,
)

// If security = [] or [{}] just hide it on readOnly mode
const isAuthHidden = computed(
  () =>
    layout === 'modal' &&
    !operation.security &&
    !Object.keys(securitySchemes ?? {}).length,
)

const selectedFilter = ref<Filter>('All')

watch(
  () => operation,
  (newOperation) => {
    if (
      selectedFilter.value === 'Body' &&
      newOperation &&
      !canMethodHaveBody(newOperation.method)
    ) {
      selectedFilter.value = 'All'
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

// If the request has no summary, use the path or fallback
const handleRequestNamePlaceholder = () => {
  return operation.summary
    ? operation.summary
    : operation.path.replace(REGEX.PROTOCOL, '')
      ? operation.path.replace(REGEX.PROTOCOL, '')
      : 'Request Name'
}

const labelRequestNameId = useId()

// Plugins
const pluginManager = usePluginManager()

const requestSectionViews = pluginManager.getViewComponents('request.section')

const updateOperationHandler = (key: keyof Operation, value: string) =>
  requestMutators.edit(operation.uid, key, value)

// Sets to all when auth filter is hidden but was previously selected to prevent empty section
watch(
  () => isAuthHidden.value,
  (authHidden) => {
    if (authHidden && selectedFilter.value === 'Auth') {
      selectedFilter.value = 'All'
    }
  },
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
          :for="labelRequestNameId" />
        <input
          v-if="layout !== 'modal'"
          :id="labelRequestNameId"
          class="text-c-1 group-hover-input pointer-events-auto relative z-10 -ml-0.5 h-8 w-full rounded pl-1.25 has-[:focus-visible]:outline md:-ml-1.25"
          :placeholder="handleRequestNamePlaceholder()"
          :value="operation.summary"
          @input="updateRequestNameHandler" />
        <span
          v-else
          class="text-c-1 flex h-8 items-center">
          {{ operation.summary }}
        </span>
      </div>
      <SectionFilter
        v-model="selectedFilter"
        :filterIds="filterIds"
        :filters="filters" />
    </template>
    <div
      :id="filterIds.All"
      class="request-section-content custom-scroll relative flex flex-1 flex-col"
      :role="selectedFilter === 'All' ? 'tabpanel' : 'none'">
      <RequestAuth
        v-if="
          collection &&
          workspace &&
          (layout !== 'modal' || Object.keys(securitySchemes ?? {}).length)
        "
        v-show="
          !isAuthHidden &&
          (selectedFilter === 'All' || selectedFilter === 'Auth')
        "
        :id="filterIds.Auth"
        class="request-section-content-auth"
        :collection="collection"
        :envVariables="envVariables"
        :environment="environment"
        layout="client"
        :operation="operation"
        :role="selectedFilter === 'All' ? 'none' : 'tabpanel'"
        :selectedSecuritySchemeUids="selectedSecuritySchemeUids"
        :server="server"
        title="Authentication"
        :workspace="workspace" />
      <RequestPathParams
        v-show="
          (selectedFilter === 'All' || selectedFilter === 'Variables') &&
          example.parameters.path.length
        "
        :id="filterIds.Variables"
        class="request-section-content-path-params"
        :envVariables="envVariables"
        :environment="environment"
        :example="example"
        :invalidParams="invalidParams"
        :operation="operation"
        paramKey="path"
        :role="selectedFilter === 'All' ? 'none' : 'tabpanel'"
        title="Variables"
        :workspace="workspace" />
      <RequestParams
        v-show="selectedFilter === 'All' || selectedFilter === 'Cookies'"
        :id="filterIds.Cookies"
        class="request-section-content-cookies"
        :envVariables="envVariables"
        :environment="environment"
        :example="example"
        :invalidParams="invalidParams"
        label="Cookie"
        :operation="operation"
        paramKey="cookies"
        :readOnlyEntries="activeWorkspaceCookies"
        :role="selectedFilter === 'All' ? 'none' : 'tabpanel'"
        title="Cookies"
        :workspace="workspace" />
      <RequestParams
        v-show="selectedFilter === 'All' || selectedFilter === 'Headers'"
        :id="filterIds.Headers"
        class="request-section-content-headers"
        :envVariables="envVariables"
        :environment="environment"
        :example="example"
        :invalidParams="invalidParams"
        label="Header"
        :operation="operation"
        paramKey="headers"
        :role="selectedFilter === 'All' ? 'none' : 'tabpanel'"
        title="Headers"
        :workspace="workspace" />
      <RequestParams
        v-show="selectedFilter === 'All' || selectedFilter === 'Query'"
        :id="filterIds.Query"
        class="request-section-content-query"
        :envVariables="envVariables"
        :environment="environment"
        :example="example"
        :invalidParams="invalidParams"
        label="Parameter"
        :operation="operation"
        paramKey="query"
        :role="selectedFilter === 'All' ? 'none' : 'tabpanel'"
        title="Query Parameters"
        :workspace="workspace" />
      <RequestBody
        v-if="
          operation.method &&
          (selectedFilter === 'All' || selectedFilter === 'Body') &&
          canMethodHaveBody(operation.method)
        "
        :id="filterIds.Body"
        class="request-section-content-body"
        :envVariables="envVariables"
        :environment="environment"
        :example="example"
        :operation="operation"
        :role="selectedFilter === 'All' ? 'none' : 'tabpanel'"
        title="Body"
        :workspace="workspace" />

      <template
        v-for="view in requestSectionViews"
        :key="view.component">
        <ScalarErrorBoundary>
          <component
            :is="view.component"
            v-show="selectedFilter === 'All' || selectedFilter === view.title"
            @update:operation="updateOperationHandler"
            :operation="operation" />
        </ScalarErrorBoundary>
      </template>

      <!-- Spacer -->
      <div class="flex flex-grow" />

      <!-- Code Snippet -->
      <ScalarErrorBoundary>
        <RequestCodeExample
          class="request-section-content-code-example -mt-1/2 border-t"
          :collection="collection"
          :example="example"
          :operation="operation"
          :server="server"
          :workspace="workspace"
          :environment="envVariables" />
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
