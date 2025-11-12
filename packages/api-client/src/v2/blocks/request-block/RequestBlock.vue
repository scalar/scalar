<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import { canMethodHaveBody } from '@scalar/helpers/http/can-method-have-body'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { REGEX } from '@scalar/helpers/regex/regex-helpers'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { AuthMeta } from '@scalar/workspace-store/mutators'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  OpenApiDocument,
  OperationObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, useId, watch } from 'vue'

import SectionFilter from '@/components/SectionFilter.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { ClientLayout } from '@/hooks'
import RequestBody from '@/v2/blocks/request-block/components/RequestBody.vue'
import RequestParams from '@/v2/blocks/request-block/components/RequestParams.vue'
import { createParameterHandlers } from '@/v2/blocks/request-block/helpers/create-parameter-handlers'
import { groupBy } from '@/v2/blocks/request-block/helpers/group-by'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import type { ClientPlugin } from '@/v2/plugins'

type Filter =
  | 'All'
  | 'Auth'
  | 'Variables'
  | 'Cookies'
  | 'Headers'
  | 'Query'
  | 'Body'

const {
  operation,
  method,
  layout,
  securitySchemes,
  path,
  exampleKey,
  security,
  eventBus,
  environment,
  server,
  selectedSecurity,
  plugins,
  authMeta = { type: 'document' },
} = defineProps<{
  method: HttpMethod
  path: string
  operation: OperationObject
  authMeta?: AuthMeta
  exampleKey: string
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  selectedSecurity: OpenApiDocument['x-scalar-selected-security']
  security: OpenApiDocument['security']
  server?: ServerObject
  layout: ClientLayout
  plugins?: ClientPlugin[]
  eventBus: WorkspaceEventBus
  environment: XScalarEnvironment
}>()

/** Operation metadata used across event emissions */
const meta = computed(() => ({
  method,
  path,
  exampleKey,
}))

/** Parameters grouped by type (path, query, header, cookie) */
const sections = computed(() =>
  groupBy(
    operation.parameters?.map((param) => getResolvedRef(param)) ?? [],
    'in',
  ),
)

/** Currently selected filter for the request sections */
const selectedFilter = ref<Filter>('All')

/** Available operation sections */
const OPERATION_SECTIONS: readonly Filter[] = [
  'Auth',
  'Variables',
  'Cookies',
  'Headers',
  'Query',
  'Body',
] as const

/** Filters available based on operation state */
const filters = computed<Filter[]>(() => {
  const availableFilters = new Set<Filter>(['All', ...OPERATION_SECTIONS])

  if (!sections.value.path?.length) {
    availableFilters.delete('Variables')
  }
  if (!canMethodHaveBody(method)) {
    availableFilters.delete('Body')
  }
  if (isAuthHidden.value) {
    availableFilters.delete('Auth')
  }

  return [...availableFilters]
})

/** Generate stable IDs for filter sections */
const filterIds = computed(
  () =>
    Object.fromEntries(
      filters.value.map((section) => [section, useId()]),
    ) as Record<Filter, string>,
)

/**
 * Hide auth selector in readonly mode when no security schemes are defined.
 * This keeps the UI clean when there are no authentication options available.
 */
const isAuthHidden = computed(
  () =>
    layout === 'modal' &&
    !operation.security &&
    !Object.keys(securitySchemes ?? {}).length,
)

/** Get a sensible placeholder for the request name input */
const requestNamePlaceholder = computed(() => {
  if (operation.summary) {
    return operation.summary
  }
  const cleanPath = path.replace(REGEX.PROTOCOL, '')
  return cleanPath || 'Request Name'
})

/** Check if the section should be shown based on the selected filter */
const isSectionVisible = (section: Filter): boolean => {
  return selectedFilter.value === 'All' || selectedFilter.value === section
}

/**
 * Reset filter to 'All' if Body filter is selected but method changes to one that cannot have a body.
 * This prevents showing an empty Body section when switching methods.
 */
watch(
  () => method,
  (newMethod) => {
    if (selectedFilter.value === 'Body' && !canMethodHaveBody(newMethod)) {
      selectedFilter.value = 'All'
    }
  },
)

/** Handle operation summary updates */
const handleSummaryUpdate = (event: Event): void => {
  const summary = (event.target as HTMLInputElement).value
  eventBus.emit('operation:update:summary', {
    meta: meta.value,
    payload: { summary },
  })
}

/** Parameter handlers */
const pathHandlers = createParameterHandlers('path', eventBus, meta.value)
const cookieHandlers = createParameterHandlers('cookie', eventBus, meta.value)
const headerHandlers = createParameterHandlers('header', eventBus, meta.value)
const queryHandlers = createParameterHandlers('query', eventBus, meta.value)

/** Handle request body form row addition */
const handleAddFormRow = (payload: {
  data: Partial<{ key: string; value?: string | File }>
  contentType: string
}): void => {
  eventBus.emit('operation:add:requestBody:formRow', {
    contentType: payload.contentType,
    meta: meta.value,
    payload: {
      key: payload.data.key ?? '',
      value: payload.data.value ?? '',
    },
  })
}

/** Handle request body form row deletion */
const handleDeleteFormRow = (payload: {
  contentType: string
  index: number
}): void =>
  eventBus.emit('operation:delete:requestBody:formRow', {
    contentType: payload.contentType,
    index: payload.index,
    meta: meta.value,
  })

/** Handle request body content type update */
const handleUpdateContentType = (payload: { value: string }): void =>
  eventBus.emit('operation:update:requestBody:contentType', {
    payload: { contentType: payload.value },
    meta: meta.value,
  })

/** Handle request body form row update */
const handleUpdateFormRow = (payload: {
  index: number
  data: Partial<{ key: string; value: string | File | null }>
  contentType: string
}): void =>
  eventBus.emit('operation:update:requestBody:formRow', {
    contentType: payload.contentType,
    meta: meta.value,
    index: payload.index,
    payload: {
      key: payload.data.key ?? '',
      value: payload.data.value ?? '',
    },
  })

/** Handle request body value update */
const handleUpdateBodyValue = (payload: {
  value?: string | File
  contentType: string
}): void =>
  eventBus.emit('operation:update:requestBody:value', {
    contentType: payload.contentType,
    payload: { value: payload.value ?? '' },
    meta: meta.value,
  })

const labelRequestNameId = useId()
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
          :placeholder="requestNamePlaceholder"
          :value="operation.summary"
          @input="handleSummaryUpdate" />
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

    <!-- Auth Selector -->
    <AuthSelector
      v-show="isSectionVisible('Auth') && !isAuthHidden"
      :id="filterIds.Auth"
      :environment
      :eventBus
      :meta="authMeta"
      :security
      :securitySchemes
      :selectedSecurity
      :server
      title="Authorization" />

    <!-- Variables (Path Parameters) -->
    <RequestParams
      v-show="isSectionVisible('Variables') && sections.path?.length"
      :id="filterIds.Variables"
      :environment
      :exampleKey
      :parameters="sections.path ?? []"
      :showAddRowPlaceholder="false"
      title="Variables"
      @delete="pathHandlers.onDelete"
      @deleteAll="pathHandlers.onDeleteAll"
      @update="pathHandlers.onUpdate" />

    <!-- Cookies -->
    <RequestParams
      v-show="isSectionVisible('Cookies')"
      :id="filterIds.Cookies"
      :environment
      :exampleKey
      :parameters="sections.cookie ?? []"
      :showAddRowPlaceholder="true"
      title="Cookies"
      @add="cookieHandlers.onAdd"
      @delete="cookieHandlers.onDelete"
      @deleteAll="cookieHandlers.onDeleteAll"
      @update="cookieHandlers.onUpdate" />

    <!-- Headers -->
    <RequestParams
      v-show="isSectionVisible('Headers')"
      :id="filterIds.Headers"
      :environment
      :exampleKey
      :parameters="sections.header ?? []"
      title="Headers"
      @add="headerHandlers.onAdd"
      @delete="headerHandlers.onDelete"
      @deleteAll="headerHandlers.onDeleteAll"
      @update="headerHandlers.onUpdate" />

    <!-- Query Parameters -->
    <RequestParams
      v-show="isSectionVisible('Query')"
      :id="filterIds.Query"
      :environment
      :exampleKey
      :parameters="sections.query ?? []"
      title="Query Parameters"
      @add="queryHandlers.onAdd"
      @delete="queryHandlers.onDelete"
      @deleteAll="queryHandlers.onDeleteAll"
      @update="queryHandlers.onUpdate" />

    <!-- Request Body -->
    <RequestBody
      v-show="isSectionVisible('Body') && canMethodHaveBody(method)"
      :id="filterIds.Body"
      :environment
      :exampleKey
      :requestBody="getResolvedRef(operation.requestBody)"
      title="Request Body"
      @add:formRow="handleAddFormRow"
      @delete:fromRow="handleDeleteFormRow"
      @update:contentType="handleUpdateContentType"
      @update:formRow="handleUpdateFormRow"
      @update:value="handleUpdateBodyValue" />

    <!-- Inject request section plugin components -->
    <ScalarErrorBoundary
      v-for="(plugin, index) in plugins"
      :key="index">
      <component
        :is="plugin.components.request"
        v-if="plugin?.components?.request"
        :operation
        :selectedExample="exampleKey" />
    </ScalarErrorBoundary>
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
