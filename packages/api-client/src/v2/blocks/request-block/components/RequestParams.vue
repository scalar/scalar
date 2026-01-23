<script setup lang="ts">
import { ScalarButton, ScalarTooltip } from '@scalar/components'
import type {
  ApiReferenceEvents,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed } from 'vue'

import { CollapsibleSection } from '@/v2/components/layout'

import RequestTable from './RequestTable.vue'
import type { TableRow } from './RequestTableRow.vue'

const {
  rows,
  exampleKey,
  environment,
  title,
  globalRoute,
  showAddRowPlaceholder = true,
  eventBus,
} = defineProps<{
  rows: TableRow[]
  exampleKey: string
  title: string
  label?: string
  invalidParams?: Set<string>
  globalRoute?: string
  showAddRowPlaceholder?: boolean
  environment: XScalarEnvironment
  eventBus: WorkspaceEventBus
}>()

const emit = defineEmits<{
  (
    e: 'upsert',
    index: number,
    payload: ApiReferenceEvents['operation:upsert:parameter']['payload'],
  ): void
  (e: 'delete', payload: { index: number }): void
  (e: 'deleteAll'): void
}>()

const showTooltip = computed(() => rows.length > 1)

/** Needed for type guard */
const handleUpserRow = (
  index: number,
  payload: {
    name: string
    value: string | File | undefined
    isDisabled: boolean
  },
) => {
  const { value, ...rest } = payload

  // Type guard here as we cannot add files to params
  if (value instanceof File) {
    return
  }

  emit('upsert', index, { ...rest, value: value ?? '' })
}
</script>
<template>
  <CollapsibleSection
    class="group/params"
    :itemCount="rows.length">
    <template #title>{{ title }}</template>
    <template #actions>
      <div
        class="text-c-2 request-meta-buttons flex whitespace-nowrap opacity-0 group-hover/params:opacity-100 has-[:focus-visible]:opacity-100">
        <ScalarTooltip
          v-if="showTooltip"
          content="Clear optional parameters"
          placement="left">
          <ScalarButton
            class="pr-0.75 pl-1 transition-none"
            size="sm"
            variant="ghost"
            @click.stop="emit('deleteAll')">
            Clear
            <span class="sr-only">All {{ title }}</span>
          </ScalarButton>
        </ScalarTooltip>
      </div>
    </template>
    <RequestTable
      class="flex-1"
      :columns="['32px', '', '']"
      :data="rows"
      :environment="environment"
      :exampleKey="exampleKey"
      :globalRoute="globalRoute"
      :invalidParams="invalidParams"
      :label="label"
      :showAddRowPlaceholder="showAddRowPlaceholder"
      @deleteRow="(index) => emit('delete', { index })"
      @navigate="(route) => eventBus.emit('ui:route:page', { name: route })"
      @upsertRow="handleUpserRow" />
  </CollapsibleSection>
</template>
