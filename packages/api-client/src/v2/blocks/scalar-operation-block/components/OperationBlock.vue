<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { canMethodHaveBody, REGEX } from '@scalar/oas-utils/helpers'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  SecuritySchemeObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, useId, watch } from 'vue'

import SectionFilter from '@/components/SectionFilter.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { ClientLayout } from '@/hooks'
import type { EnvVariable } from '@/store'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import type { UpdateSecuritySchemeEvent } from '@/v2/blocks/scalar-auth-selector-block/event-types'
import OperationBody from '@/v2/blocks/scalar-operation-block/components/OperationBody.vue'
import OperationParams from '@/v2/blocks/scalar-operation-block/components/OperationParams.vue'
import { groupBy } from '@/v2/blocks/scalar-operation-block/helpers/group-by'

const {
  operation,
  method,
  layout,
  securitySchemes,
  path,
  security,
  selectedContentType,
} = defineProps<{
  /** Operation method */
  method: HttpMethod
  /** Operation path */
  path: string
  /** Operation object */
  operation: OperationObject
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

  /** TODO: remove when we migrate */
  environment: Environment
  envVariables: EnvVariable[]
}>()

/**
 * All events that are emitted by the operation block
 *
 * We prefix all the underlying events by the scope
 * - scope:action:name
 */
const emits = defineEmits<{
  (e: 'operation:update:requestName', payload: { name: string }): void

  /** Auth events */
  (e: 'auth:delete', names: string[]): void
  (e: 'auth:update:securityScheme', payload: UpdateSecuritySchemeEvent): void
  (
    e: 'auth:update:selectedScopes',
    payload: { id: string[]; name: string; scopes: string[] },
  ): void
  (
    e: 'auth:update:selectedSecurity',
    payload: {
      value: NonNullable<OpenApiDocument['x-scalar-selected-security']>
      create: SecuritySchemeObject[]
    },
  ): void

  /** Parameter events */
  (
    e: 'parameters:add',
    payload: {
      type: ParameterObject['in']
      payload: Partial<{ key: string; value: string }>
    },
  ): void
  (
    e: 'parameters:update',
    payload: {
      index: number
      type: ParameterObject['in']
      payload: Partial<{ key: string; value: string; isEnabled: boolean }>
    },
  ): void
  (
    e: 'parameters:delete',
    payload: { type: ParameterObject['in']; index: number },
  ): void
  (
    e: 'parameters:deleteAll',
    payload: {
      type: ParameterObject['in']
    },
  ): void

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

const sections = groupBy(
  operation.parameters?.map((it) => getResolvedRef(it)) ?? [],
  'in',
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

  if (!sections.path?.length) {
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
              emits('operation:update:requestName', {
                name: (event.target as HTMLInputElement).value,
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
      @deleteOperationAuth="(payload) => emits('auth:delete', payload)"
      @update:securityScheme="
        (payload) => emits('auth:update:securityScheme', payload)
      "
      @update:selectedScopes="
        (payload) => emits('auth:update:selectedScopes', payload)
      "
      @update:selectedSecurity="
        (payload) => emits('auth:update:selectedSecurity', payload)
      " />
    <OperationParams
      v-show="isSectionVisible('Variables') && sections.path?.length"
      :id="filterIds.Variables"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :parameters="sections.path ?? []"
      title="Variables"
      @add="
        (payload) =>
          emits('parameters:add', {
            type: 'path',
            payload,
          })
      "
      @delete="
        (payload) =>
          emits('parameters:delete', {
            type: 'path',
            ...payload,
          })
      "
      @deleteAll="
        () =>
          emits('parameters:deleteAll', {
            type: 'path',
          })
      "
      @update="
        (payload) =>
          emits('parameters:update', {
            type: 'path',
            ...payload,
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
      @add="
        (payload) =>
          emits('parameters:add', {
            type: 'cookie',
            payload,
          })
      "
      @delete="
        (payload) =>
          emits('parameters:delete', {
            type: 'cookie',
            ...payload,
          })
      "
      @deleteAll="
        () =>
          emits('parameters:deleteAll', {
            type: 'cookie',
          })
      "
      @update="
        (payload) =>
          emits('parameters:update', {
            type: 'cookie',
            ...payload,
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
        (payload) =>
          emits('parameters:add', {
            type: 'header',
            payload,
          })
      "
      @delete="
        (payload) =>
          emits('parameters:delete', {
            type: 'header',
            ...payload,
          })
      "
      @deleteAll="
        () =>
          emits('parameters:deleteAll', {
            type: 'header',
          })
      "
      @update="
        (payload) =>
          emits('parameters:update', {
            type: 'header',
            ...payload,
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
        (payload) =>
          emits('parameters:add', {
            type: 'query',
            payload,
          })
      "
      @delete="
        (payload) =>
          emits('parameters:delete', {
            type: 'query',
            ...payload,
          })
      "
      @deleteAll="
        () =>
          emits('parameters:deleteAll', {
            type: 'query',
          })
      "
      @update="
        (payload) =>
          emits('parameters:update', {
            type: 'query',
            ...payload,
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
