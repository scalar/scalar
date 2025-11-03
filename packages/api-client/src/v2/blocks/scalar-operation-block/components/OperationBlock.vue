<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { canMethodHaveBody, REGEX } from '@scalar/oas-utils/helpers'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { AuthMeta } from '@scalar/workspace-store/mutators'
import type {
  OpenApiDocument,
  OperationObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, useId, watch } from 'vue'

import SectionFilter from '@/components/SectionFilter.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { ClientLayout } from '@/hooks'
import type { EnvVariable } from '@/store'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import OperationBody from '@/v2/blocks/scalar-operation-block/components/OperationBody.vue'
import OperationParams from '@/v2/blocks/scalar-operation-block/components/OperationParams.vue'
import { groupBy } from '@/v2/blocks/scalar-operation-block/helpers/group-by'
import type { ClientPlugin } from '@/v2/plugins'

const {
  operation,
  method,
  layout,
  securitySchemes,
  path,
  exampleKey,
  security,
  selectedContentType,
  authMeta = { type: 'document' },
} = defineProps<{
  /** Operation method */
  method: HttpMethod
  /** Operation path */
  path: string
  /** Operation object */
  operation: OperationObject
  /** Meta information for the auth update */
  authMeta?: AuthMeta
  /** Currently selected example key for the current operation */
  exampleKey: string
  /** Currently selected content type for the current operation example */
  selectedContentType?: string
  /** Document defined security schemes */
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  /** Currently selected security for the current operation */
  selectedSecurity: OpenApiDocument['x-scalar-selected-security']
  /** Required security for the operation/document */
  security: OpenApiDocument['security']
  /** Currently selected server for the current operation/document/workspace */
  server?: ServerObject
  /** Client layout */
  layout: ClientLayout
  /** Registered app plugins */
  plugins?: ClientPlugin[]

  eventBus: WorkspaceEventBus

  /** TODO: remove when we migrate */
  environment: Environment
  envVariables: EnvVariable[]
}>()

const meta = computed(() => ({
  method,
  path,
  exampleKey,
}))

/**
 * All events that are emitted by the operation block
 *
 * We prefix all the underlying events by the scope
 * - scope:action:name
 */
const emits = defineEmits<{
  /** Request Body events */
  (e: 'requestBody:update:contentType', payload: { value: string }): void
  /** We use this event to update raw values */
  (e: 'requestBody:update:value', payload: { value?: string | File }): void
  /** We use this event to update  */
  (
    e: 'requestBody:add:formRow',
    payload: Partial<{ key: string; value?: string | File }>,
  ): void
  (
    e: 'requestBody:update:formRow',
    payload: {
      index: number
      payload: Partial<{ key: string; value?: string | File }>
    },
  ): void
}>()

const sections = computed(() =>
  groupBy(operation.parameters?.map((it) => getResolvedRef(it)) ?? [], 'in'),
)

const operationSections = [
  'Auth',
  'Variables',
  'Cookies',
  'Headers',
  'Query',
  'Body',
] as const

type Filter = 'All' | (typeof operationSections)[number]

/** Currently selected filter for the operation block */
const selectedFilter = ref<Filter>('All')

/** A list of all available filters */
const filters = computed<Filter[]>(() => {
  const allSections = new Set<Filter>(['All', ...operationSections])

  if (!sections.value.path?.length) {
    allSections.delete('Variables')
  }
  if (!canMethodHaveBody(method)) {
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

watch(
  () => method,
  (newMethod) => {
    if (selectedFilter.value === 'Body' && !canMethodHaveBody(newMethod)) {
      selectedFilter.value = 'All'
    }
  },
)

/**
 * When we are on the readonly mode and there is no
 * security schemes we can hide the auth selector
 */
const isAuthHidden = computed(
  () =>
    layout === 'modal' &&
    !operation.security &&
    !Object.keys(securitySchemes ?? {}).length,
)

/**
 * If the request has no summary, use the path or fallback
 */
const handleRequestNamePlaceholder = () => {
  return operation.summary
    ? operation.summary
    : path.replace(REGEX.PROTOCOL, '')
      ? path.replace(REGEX.PROTOCOL, '')
      : 'Request Name'
}

/** Check if the section should be shown based on the selected filter */
const isSectionVisible = (section: Filter) => {
  return selectedFilter.value === 'All' || selectedFilter.value === section
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
          :placeholder="handleRequestNamePlaceholder()"
          :value="operation.summary"
          @input="
            (event) =>
              eventBus.emit('operation:update:description', {
                description: (event.target as HTMLInputElement).value,
                meta,
              })
          " />
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
    <AuthSelector
      v-show="isSectionVisible('Auth') && !isAuthHidden"
      :id="filterIds.Auth"
      :envVariables="envVariables"
      :environment="environment"
      :layout="'client'"
      :security="security"
      :securitySchemes="securitySchemes"
      :selectedSecurity="selectedSecurity"
      :server="server"
      :title="'Authorization'"
      :meta="authMeta"
      :eventBus="eventBus" />
    <OperationParams
      v-show="isSectionVisible('Variables') && sections.path?.length"
      :id="filterIds.Variables"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :parameters="sections.path ?? []"
      title="Variables"
      :show-add-row-placeholder="false"
      @delete="
        ({ index }) =>
          eventBus.emit('operation:delete:parameter', {
            type: 'path',
            index,
            meta,
          })
      "
      @deleteAll="
        () =>
          eventBus.emit('operation:delete-all:parameters', {
            type: 'path',
            meta,
          })
      "
      @update="
        ({ index, payload }) =>
          eventBus.emit('operation:update:parameter', {
            type: 'path',
            index,
            payload,
            meta,
          })
      " />
    <OperationParams
      v-show="isSectionVisible('Cookies')"
      :id="filterIds.Cookies"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :parameters="sections.cookie ?? []"
      title="Cookies"
      :show-add-row-placeholder="true"
      @add="
        ({ key, value }) =>
          eventBus.emit('operation:add:parameter', {
            type: 'cookie',
            payload: { key: key ?? '', value: value ?? '', isEnabled: true },
            meta,
          })
      "
      @delete="
        ({ index }) =>
          eventBus.emit('operation:delete:parameter', {
            type: 'cookie',
            index,
            meta,
          })
      "
      @deleteAll="
        () =>
          eventBus.emit('operation:delete-all:parameters', {
            type: 'cookie',
            meta,
          })
      "
      @update="
        ({ index, payload }) =>
          eventBus.emit('operation:update:parameter', {
            type: 'cookie',
            index,
            payload,
            meta,
          })
      " />
    <OperationParams
      v-show="isSectionVisible('Headers')"
      :id="filterIds.Headers"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :parameters="sections.header ?? []"
      title="Headers"
      @add="
        ({ key, value }) =>
          eventBus.emit('operation:add:parameter', {
            type: 'header',
            payload: { key: key ?? '', value: value ?? '', isEnabled: true },
            meta,
          })
      "
      @delete="
        ({ index }) =>
          eventBus.emit('operation:delete:parameter', {
            type: 'header',
            index,
            meta,
          })
      "
      @deleteAll="
        () =>
          eventBus.emit('operation:delete-all:parameters', {
            type: 'header',
            meta,
          })
      "
      @update="
        ({ index, payload }) =>
          eventBus.emit('operation:update:parameter', {
            type: 'header',
            index,
            payload,
            meta,
          })
      " />
    <OperationParams
      v-show="isSectionVisible('Query')"
      :id="filterIds.Query"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :parameters="sections.query ?? []"
      title="Query Parameters"
      @add="
        ({ key, value }) =>
          eventBus.emit('operation:add:parameter', {
            type: 'query',
            payload: { key: key ?? '', value: value ?? '', isEnabled: true },
            meta,
          })
      "
      @delete="
        ({ index }) =>
          eventBus.emit('operation:delete:parameter', {
            type: 'query',
            index,
            meta,
          })
      "
      @deleteAll="
        () =>
          eventBus.emit('operation:delete-all:parameters', {
            type: 'query',
            meta,
          })
      "
      @update="
        ({ index, payload }) =>
          eventBus.emit('operation:update:parameter', {
            type: 'query',
            index,
            payload,
            meta,
          })
      " />
    <OperationBody
      v-show="isSectionVisible('Body') && canMethodHaveBody(method)"
      :id="filterIds.Body"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :requestBody="getResolvedRef(operation.requestBody)"
      :selectedContentType="selectedContentType ?? 'other'"
      title="Request Body"
      @add:formRow="(payload) => emits('requestBody:add:formRow', payload)"
      @update:contentType="
        (payload) => emits('requestBody:update:contentType', payload)
      "
      @update:formRow="
        (payload) => emits('requestBody:update:formRow', payload)
      "
      @update:value="(payload) => emits('requestBody:update:value', payload)" />

    <!-- Inject request section plugin components -->
    <ScalarErrorBoundary
      v-for="(plugin, index) in plugins"
      :key="index">
      <component
        v-if="plugin?.components?.request"
        :is="plugin.components.request"
        :operation="operation"
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
