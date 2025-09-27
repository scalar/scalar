<script setup lang="ts">
import { ScalarButton, ScalarTooltip } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import type { EnvVariable } from '@/store/active-entities'
import OperationTable from '@/v2/blocks/scalar-operation-block/components/OperationTable.vue'
import type { TableRow } from '@/v2/blocks/scalar-operation-block/components/OperationTableRow.vue'
import {
  getExample,
  getSchema,
} from '@/v2/blocks/scalar-operation-block/helpers/request'

const {
  parameters,
  exampleKey,
  environment,
  envVariables,
  title,
  globalRoute,
} = defineProps<{
  parameters: ParameterObject[]
  exampleKey: string
  title: string
  label?: string
  invalidParams?: Set<string>
  globalRoute?: string
  /** TODO: remove as soon as we migrate to everything to the new store */
  environment: Environment
  envVariables: EnvVariable[]
}>()

const emits = defineEmits<{
  (e: 'add', payload: Partial<{ key: string; value: string }>): void
  (
    e: 'update',
    payload: {
      index: number
      payload: Partial<{ key: string; value: string; isEnabled: boolean }>
    },
  ): void
  (e: 'delete', payload: { index: number }): void
  (e: 'deleteAll'): void
}>()

const tableRows = computed<TableRow[]>(() => {
  return parameters.map((param) => ({
    name: param.name,
    value: getExample(param, exampleKey)?.value,
    globalRoute,
    schema: getSchema(param),
    isRequired: param.required,
    isDisabled: getExample(param, exampleKey)?.['x-is-disabled'] ?? false,
  }))
})

const addRow = () => {
  parameters.push({
    name: 'test',
    in: 'query',
    schema: { type: 'string' },
  })
}

const showTooltip = computed(() => parameters.length > 1)
</script>
<template>
  <ViewLayoutCollapse
    class="group/params"
    :itemCount="parameters.length">
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
            @click.stop="emits('deleteAll')">
            Clear
            <span class="sr-only">All {{ title }}</span>
          </ScalarButton>
        </ScalarTooltip>
      </div>
    </template>
    <OperationTable
      class="flex-1"
      :columns="['32px', '', '']"
      :data="tableRows"
      :envVariables="envVariables"
      :environment="environment"
      :exampleKey="exampleKey"
      :globalRoute="globalRoute"
      :invalidParams="invalidParams"
      :label="label"
      @addRow="addRow"
      @deleteRow="(index) => emits('delete', { index })"
      @updateRow="(index, payload) => emits('update', { index, payload })" />
  </ViewLayoutCollapse>
</template>
