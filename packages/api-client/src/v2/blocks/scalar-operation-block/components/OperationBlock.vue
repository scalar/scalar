<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { canMethodHaveBody, REGEX } from '@scalar/oas-utils/helpers'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  OperationObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, useId, watch } from 'vue'

import SectionFilter from '@/components/SectionFilter.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { ClientLayout } from '@/hooks'
import type { EnvVariable } from '@/store'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import OperationBody from '@/v2/blocks/scalar-operation-block/components/OperationBody.vue'
import OperationParams from '@/v2/blocks/scalar-operation-block/components/OperationParams.vue'
import { groupBy } from '@/v2/blocks/scalar-operation-block/helpers/groupBy'

const { operation, method, layout, securitySchemes, path } = defineProps<{
  method: HttpMethod
  path: string
  operation: OperationObject
  exampleKey: string
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  selectedSecurity: OpenApiDocument['security']

  layout: ClientLayout

  /** TODO: remove when we migrate */
  environment: Environment
  envVariables: EnvVariable[]
}>()

// TODO: emit all events for the block
const emits = defineEmits<{
  (e: 'update:RequestName', payload: { name: string }): void
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
              emits('update:RequestName', {
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
      :security="operation.security"
      :securitySchemes="securitySchemes"
      :selectedSecurity="selectedSecurity"
      :server="undefined"
      :title="'Authorization'" />
    <OperationParams
      v-show="isSectionVisible('Variables') && sections.path?.length"
      :id="filterIds.Variables"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :parameters="sections.path ?? []"
      title="Variables" />
    <OperationParams
      v-show="isSectionVisible('Cookies')"
      :id="filterIds.Cookies"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :parameters="sections.cookie ?? []"
      title="Cookies" />
    <OperationParams
      v-show="isSectionVisible('Headers')"
      :id="filterIds.Headers"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :parameters="sections.header ?? []"
      title="Headers" />
    <OperationParams
      v-show="isSectionVisible('Query')"
      :id="filterIds.Query"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :parameters="sections.query ?? []"
      title="Query Parameters" />
    <OperationBody
      v-show="isSectionVisible('Body') && canMethodHaveBody(method)"
      :id="filterIds.Body"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :requestBody="getResolvedRef(operation.requestBody)"
      :selectedContentType="'application/json'"
      title="Request Body" />
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
