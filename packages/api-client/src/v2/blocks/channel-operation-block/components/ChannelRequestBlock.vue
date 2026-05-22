<script lang="ts">
export default {
  name: 'ChannelRequestBlock',
}
</script>

<script setup lang="ts">
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ChannelMessageEntry, ChannelParametersContext } from '@scalar/workspace-store/channel-example'
import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import type { AuthMeta, WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  type MergedSecuritySchemes,
  type SecuritySchemeObjectSecret,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  OpenApiDocument,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { computed, ref, useId } from 'vue'

import SectionFilter from '@/components/SectionFilter.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { createChannelParameterRows } from '@/v2/blocks/channel-operation-block/helpers/create-channel-parameter-rows'
import { getMessagePayloadExample } from '@/v2/blocks/channel-operation-block/helpers/get-message-payload-example'
import RequestTable from '@/v2/blocks/request-block/components/RequestTable.vue'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import type { ApiClientOptions } from '@/v2/types/options'
import { CollapsibleSection } from '@/v2/components/layout'
import type { ClientLayout } from '@/v2/types/layout'

import ChannelMessageEditor from './ChannelMessageEditor.vue'

const CHANNEL_SECTIONS = ['Params', 'Query', 'Auth', 'Message'] as const
type Filter = 'All' | (typeof CHANNEL_SECTIONS)[number]

const {
  authMeta,
  environment,
  eventBus,
  layout,
  operation,
  operationName,
  parameters,
  messages,
  selectedMessageName,
  outgoingPayload,
  canSend,
  isConnected,
  proxyUrl,
  securityRequirements,
  securitySchemes,
  selectedSecurity,
  selectedSecuritySchemes,
  server,
  options,
} = defineProps<{
  authMeta: AuthMeta
  environment: XScalarEnvironment
  eventBus: WorkspaceEventBus
  layout: ClientLayout
  operation: AsyncApiOperationObject
  operationName: string
  parameters: ChannelParametersContext
  messages: ChannelMessageEntry[]
  selectedMessageName: string | null
  outgoingPayload: string
  canSend: boolean
  /** Whether the WebSocket session is open */
  isConnected: boolean
  proxyUrl: string
  securityRequirements: OpenApiDocument['security']
  securitySchemes: MergedSecuritySchemes
  selectedSecurity: SelectedSecurity
  selectedSecuritySchemes: SecuritySchemeObjectSecret[]
  server: ServerObject | null
  plugins: ClientPlugin[]
  options?: ApiClientOptions
}>()

const emit = defineEmits<{
  (e: 'update:pathParameter', payload: { name: string; value: string }): void
  (e: 'update:queryParameter', payload: { name: string; value: string }): void
  (e: 'update:selectedMessageName', value: string): void
  (e: 'update:outgoingPayload', value: string): void
  (e: 'send:message'): void
}>()

const selectedFilter = ref<Filter>('All')
const filters = computed<Filter[]>(() => {
  const available = new Set<Filter>(['All', ...CHANNEL_SECTIONS])

  if (!pathRows.value.length) {
    available.delete('Params')
  }

  if (!queryRows.value.length) {
    available.delete('Query')
  }

  if (!canSend || !messages.length) {
    available.delete('Message')
  }

  return [...available]
})

const filterIds = computed(
  () =>
    Object.fromEntries(filters.value.map((section) => [section, useId()])) as Record<Filter, string>,
)

const isSectionVisible = (section: Filter): boolean =>
  selectedFilter.value === 'All' || selectedFilter.value === section

const pathRows = computed(() =>
  createChannelParameterRows(parameters.definitions, parameters.path),
)

const queryRows = computed(() =>
  createChannelParameterRows(parameters.definitions, parameters.query),
)

const handlePathUpsert = (
  _index: number,
  payload: { name: string; value: string | File | undefined },
): void => {
  if (payload.value instanceof File) {
    return
  }

  emit('update:pathParameter', { name: payload.name, value: payload.value ?? '' })
}

const handleQueryUpsert = (
  _index: number,
  payload: { name: string; value: string | File | undefined },
): void => {
  if (payload.value instanceof File) {
    return
  }

  emit('update:queryParameter', { name: payload.name, value: payload.value ?? '' })
}

const handleMessageSelect = (messageName: string): void => {
  emit('update:selectedMessageName', messageName)

  const entry = messages.find(({ name }) => name === messageName)
  if (entry) {
    emit('update:outgoingPayload', getMessagePayloadExample(entry.message))
  }
}

const requestNamePlaceholder = computed(() => operation.title ?? operationName)
</script>

<template>
  <ViewLayoutSection :aria-label="`Channel request: ${operation.title ?? operationName}`">
    <template #title>
      <span class="text-c-1">{{ operation.summary ?? requestNamePlaceholder }}</span>
      <SectionFilter
        v-model="selectedFilter"
        :filterIds="filterIds"
        :filters="filters" />
    </template>

    <div
      :id="filterIds.All"
      class="request-section-content custom-scroll relative flex flex-1 flex-col"
      :role="selectedFilter === 'All' ? 'tabpanel' : 'none'">
      <CollapsibleSection
        v-show="isSectionVisible('Params') && pathRows.length"
        :id="filterIds.Params"
        :itemCount="pathRows.length">
        <template #title>Params</template>
        <RequestTable
          :data="pathRows"
          :environment="environment"
          :showAddRowPlaceholder="false"
          @upsertRow="handlePathUpsert" />
      </CollapsibleSection>

      <CollapsibleSection
        v-show="isSectionVisible('Query') && queryRows.length"
        :id="filterIds.Query"
        :itemCount="queryRows.length">
        <template #title>Query</template>
        <RequestTable
          :data="queryRows"
          :environment="environment"
          :showAddRowPlaceholder="false"
          @upsertRow="handleQueryUpsert" />
      </CollapsibleSection>

      <AuthSelector
        v-show="isSectionVisible('Auth')"
        :id="filterIds.Auth"
        :createAnySecurityScheme="layout !== 'modal'"
        :environment="environment"
        :eventBus="eventBus"
        :meta="authMeta"
        :options="options"
        :proxyUrl="proxyUrl"
        :securityRequirements="securityRequirements"
        :securitySchemes="securitySchemes"
        :selectedSecurity="selectedSecurity"
        :selectedSecuritySchemes="selectedSecuritySchemes"
        :server="server"
        title="Authentication" />

      <ChannelMessageEditor
        v-show="isSectionVisible('Message') && canSend && messages.length"
        :id="filterIds.Message"
        :canSend="canSend && isConnected"
        :environment="environment"
        :messages="messages"
        :payload="outgoingPayload"
        :selectedMessageName="selectedMessageName"
        @send="emit('send:message')"
        @update:payload="(value) => emit('update:outgoingPayload', value)"
        @update:selectedMessageName="handleMessageSelect" />
    </div>
  </ViewLayoutSection>
</template>
