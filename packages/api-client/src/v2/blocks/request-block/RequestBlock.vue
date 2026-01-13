<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import { canMethodHaveBody } from '@scalar/helpers/http/can-method-have-body'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { REGEX } from '@scalar/helpers/regex/regex-helpers'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { AuthMeta } from '@scalar/workspace-store/mutators'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  OpenApiDocument,
  OperationObject,
  SecuritySchemeObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, useId, watch } from 'vue'

import SectionFilter from '@/components/SectionFilter.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { ClientLayout } from '@/hooks'
import { getExample } from '@/v2/blocks/operation-block/helpers/get-example'
import type { ClientOptionGroup } from '@/v2/blocks/operation-code-sample'
import RequestBody from '@/v2/blocks/request-block/components/RequestBody.vue'
import RequestCodeSnippet from '@/v2/blocks/request-block/components/RequestCodeSnippet.vue'
import RequestParams from '@/v2/blocks/request-block/components/RequestParams.vue'
import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'
import { createParameterHandlers } from '@/v2/blocks/request-block/helpers/create-parameter-handlers'
import { getParameterSchema } from '@/v2/blocks/request-block/helpers/get-parameter-schema'
import { groupBy } from '@/v2/blocks/request-block/helpers/group-by'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import type { ClientPlugin } from '@/v2/helpers/plugins'

type Filter =
  | 'All'
  | 'Auth'
  | 'Variables'
  | 'Cookies'
  | 'Headers'
  | 'Query'
  | 'Body'

const {
  authMeta = { type: 'document' },
  clientOptions,
  environment,
  eventBus,
  exampleKey,
  layout,
  method,
  operation,
  path,
  plugins,
  proxyUrl,
  securityRequirements,
  securitySchemes,
  selectedClient,
  selectedSecuritySchemes,
  server,
} = defineProps<{
  selectedSecurity: OpenApiDocument['x-scalar-selected-security']
  authMeta: AuthMeta
  clientOptions: ClientOptionGroup[]
  environment: XScalarEnvironment
  eventBus: WorkspaceEventBus
  exampleKey: string
  layout: ClientLayout
  method: HttpMethod
  operation: OperationObject
  path: string
  plugins: ClientPlugin[]
  proxyUrl: string
  securityRequirements: OpenApiDocument['security']
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  selectedClient: WorkspaceStore['workspace']['x-scalar-default-client']
  selectedSecuritySchemes: SecuritySchemeObject[]
  server: ServerObject | null
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
    (param) => {
      const example = getExample(param, exampleKey, undefined)

      return {
        name: param.name,
        value: example?.value ?? '',
        description: param.description,
        schema: getParameterSchema(param),
        isRequired: param.required,
        isDisabled: example?.['x-disabled'] ?? false,
      }
    },
  ),
)

// Generate a reverse map for fast lookup of headers by the name
const headersMap = computed(() =>
  groupBy(
    sections.value.header?.map((it) => ({
      ...it,
      name: it.name.toLowerCase(),
    })) ?? [],
    'name',
  ),
)

const AUTO_GENERATED_HEADERS = computed(() => {
  const result: { name: string; defaultValue: string }[] = []

  if (canMethodHaveBody(method)) {
    result.push({
      name: 'Content-Type',
      defaultValue:
        getResolvedRef(operation.requestBody)?.[
          'x-scalar-selected-content-type'
        ]?.[exampleKey] ?? 'application/json',
    })
  }

  result.push({
    name: 'Accept',
    defaultValue: '*/*',
  })

  return result
})

const defaultHeaders = computed(() => {
  const disableParameters =
    operation['x-scalar-disable-parameters']?.['default-headers']?.[
      exampleKey
    ] ?? {}

  return AUTO_GENERATED_HEADERS.value.map((it) => {
    const realHeader = headersMap.value[it.name.toLowerCase()]

    return {
      name: it.name,
      value: it.defaultValue,
      schema: undefined,
      isOverridden: realHeader && !realHeader[0]?.isDisabled,
      isReadonly: true,
      isDisabled: disableParameters[it.name.toLowerCase()] ?? false,
    } satisfies TableRow
  })
})

const headers = computed(() => [
  ...defaultHeaders.value,
  ...(sections.value.header ?? []),
])

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

/**
 * Pre-generated stable IDs for all possible filter sections.
 * These are created once at setup time to avoid regenerating IDs on re-render.
 */
const sectionIds: Record<Filter, string> = {
  All: useId(),
  Auth: useId(),
  Variables: useId(),
  Cookies: useId(),
  Headers: useId(),
  Query: useId(),
  Body: useId(),
}

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

/**
 * Map available filters to their pre-generated stable IDs.
 * Only includes IDs for filters that are currently available.
 */
const filterIds = computed(
  () =>
    Object.fromEntries(
      filters.value.map((section) => [section, sectionIds[section]]),
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
const parameterHandlers = computed(() => ({
  path: createParameterHandlers('path', eventBus, meta.value, {}),
  cookie: createParameterHandlers('cookie', eventBus, meta.value, {}),
  header: createParameterHandlers('header', eventBus, meta.value, {
    defaultParameters: defaultHeaders.value.length,
  }),
  query: createParameterHandlers('query', eventBus, meta.value, {}),
}))

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
  data: Partial<{
    key: string
    value: string | File | null
    isDisabled: boolean
  }>
  contentType: string
}): void =>
  eventBus.emit(
    'operation:update:requestBody:formRow',
    {
      contentType: payload.contentType,
      meta: meta.value,
      index: payload.index,
      payload: payload.data,
    },
    {
      debounceKey: `update:requestBody:formRow-${payload.index}-${Object.keys(payload.data).join('-')}`,
    },
  )

/** Handle request body value update */
const handleUpdateBodyValue = (payload: {
  value?: string | File
  contentType: string
}): void => {
  const debounceKey =
    typeof payload.value === 'string'
      ? `update:requestBody:value-${payload.contentType}`
      : undefined

  eventBus.emit(
    'operation:update:requestBody:value',
    {
      contentType: payload.contentType,
      payload: { value: payload.value ?? '' },
      meta: meta.value,
    },
    {
      debounceKey,
    },
  )
}

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

    <div
      :id="filterIds.All"
      class="request-section-content custom-scroll relative flex flex-1 flex-col"
      :role="selectedFilter === 'All' ? 'tabpanel' : 'none'">
      <!-- Auth Selector -->
      <AuthSelector
        v-show="isSectionVisible('Auth') && !isAuthHidden"
        :id="filterIds.Auth"
        :environment
        :eventBus
        :meta="authMeta"
        :proxyUrl
        :securityRequirements
        :securitySchemes
        :selectedSecurity
        :selectedSecuritySchemes
        :server
        title="Authentication" />

      <!-- Variables (Path Parameters) -->
      <RequestParams
        v-show="isSectionVisible('Variables') && sections.path?.length"
        :id="filterIds.Variables"
        :environment
        :exampleKey
        :rows="sections.path ?? []"
        :showAddRowPlaceholder="false"
        title="Variables"
        v-on="parameterHandlers.path" />

      <!-- Cookies -->
      <RequestParams
        v-show="isSectionVisible('Cookies')"
        :id="filterIds.Cookies"
        :environment
        :exampleKey
        :rows="sections.cookie ?? []"
        :showAddRowPlaceholder="true"
        title="Cookies"
        v-on="parameterHandlers.cookie" />

      <!-- Headers -->
      <RequestParams
        v-show="isSectionVisible('Headers')"
        :id="filterIds.Headers"
        :environment
        :exampleKey
        :rows="headers ?? []"
        title="Headers"
        v-on="parameterHandlers.header" />

      <!-- Query Parameters -->
      <RequestParams
        v-show="isSectionVisible('Query')"
        :id="filterIds.Query"
        :environment
        :exampleKey
        :rows="sections.query ?? []"
        title="Query Parameters"
        v-on="parameterHandlers.query" />

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

      <!-- Spacer -->
      <div class="flex flex-grow" />

      <!-- Code Snippet -->
      <RequestCodeSnippet
        v-show="selectedFilter === 'All'"
        :clientOptions
        :eventBus
        :method
        :operation
        :path
        :securitySchemes="selectedSecuritySchemes"
        :selectedClient
        :selectedServer="server ?? undefined" />
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
