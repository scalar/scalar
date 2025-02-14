<script setup lang="ts">
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import type { EnvVariable } from '@/store/active-entities'
import RequestTable from '@/views/Request/RequestSection/RequestTable.vue'
import { ScalarButton, ScalarTooltip } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import {
  type Operation,
  type RequestExample,
  requestExampleParametersSchema,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const {
  example,
  operation,
  environment,
  envVariables,
  workspace,
  title,
  paramKey,
  readOnlyEntries = [],
} = defineProps<{
  example: RequestExample
  operation: Operation
  environment: Environment
  envVariables: EnvVariable[]
  workspace: Workspace
  title: string
  paramKey: keyof RequestExample['parameters']
  readOnlyEntries?: {
    key: string
    value: string
    enabled: boolean
    route: RouteLocationRaw
  }[]
}>()

const { requestExampleMutators } = useWorkspace()

const params = computed(() => example.parameters[paramKey] ?? [])

onMounted(() => defaultRow())

/** Add a new row to a given parameter list */
const addRow = () => {
  /** Create a new parameter instance with 'enabled' set to false */
  const newParam = requestExampleParametersSchema.parse({ enabled: false })
  const newParams = [...params.value, newParam]

  requestExampleMutators.edit(example.uid, `parameters.${paramKey}`, newParams)
}

const tableWrapperRef = ref<HTMLInputElement | null>(null)

/** Update a field in a parameter row */
const updateRow = (rowIdx: number, field: 'key' | 'value', value: string) => {
  const currentParams = params.value
  if (currentParams.length > rowIdx) {
    const updatedParams = [...currentParams]
    if (!updatedParams[rowIdx]) return

    updatedParams[rowIdx] = { ...updatedParams[rowIdx], [field]: value }

    /** enable row key or value is filled */
    if (
      updatedParams[rowIdx].key !== '' ||
      updatedParams[rowIdx].value !== ''
    ) {
      updatedParams[rowIdx].enabled = true
    }

    /** check key and value input state */
    if (
      updatedParams[rowIdx].key === '' &&
      updatedParams[rowIdx].value === ''
    ) {
      /** remove if empty */
      updatedParams.splice(rowIdx, 1)
    }

    requestExampleMutators.edit(
      operation.uid,
      `parameters.${paramKey}`,
      updatedParams,
    )
  } else {
    /** if there is no row at the index, add a new one */
    const payload = [requestExampleParametersSchema.parse({ [field]: value })]
    requestExampleMutators.edit(
      operation.uid,
      `parameters.${paramKey}`,
      payload,
    )

    /** focus the new row */
    nextTick(() => {
      if (!tableWrapperRef.value) return
      const inputs = tableWrapperRef.value.querySelectorAll('input')
      const inputsIndex = field === 'key' ? 0 : 1
      inputs[inputsIndex]?.focus()
    })
  }

  // Add a new row if the updated row is the last one
  if (rowIdx === currentParams.length - 1) {
    addRow()
  }
}

/** Toggle a parameter row on or off */
const toggleRow = (rowIdx: number, enabled: boolean) =>
  requestExampleMutators.edit(
    operation.uid,
    `parameters.${paramKey}.${rowIdx}.enabled`,
    enabled,
  )

const deleteAllRows = () => {
  // filter out params that are enabled or required
  const exampleParams = params.value.filter((param) => param.required)

  requestExampleMutators.edit(
    operation.uid,
    `parameters.${paramKey}`,
    exampleParams,
  )

  /** ensure one empty row after deleting all rows */
  nextTick(() => addRow())
}

function defaultRow() {
  /** ensure one empty row by default */
  if (params.value.length === 0) {
    addRow()
  } else if (params.value.length >= 1) {
    /** ensure we always have a trailing empty row */
    const lastParam = params.value[params.value.length - 1]
    if (lastParam && lastParam.key !== '' && lastParam.value !== '') {
      addRow()
    }
  }
}

const itemCount = computed(
  () => params.value.filter((param) => param.key || param.value).length,
)

const showTooltip = computed(() => params.value.length > 1)

watch(
  () => example,
  (newVal, oldVal) => {
    if (newVal !== oldVal) defaultRow()
  },
  { immediate: true },
)

const hasReadOnlyEntries = computed(() => (readOnlyEntries ?? []).length > 0)
</script>
<template>
  <ViewLayoutCollapse
    class="group/params"
    :itemCount="itemCount">
    <template #title>{{ title }}</template>
    <template #actions>
      <div
        class="text-c-2 flex whitespace-nowrap opacity-0 group-hover/params:opacity-100 has-[:focus-visible]:opacity-100 request-meta-buttons">
        <ScalarTooltip
          v-if="showTooltip"
          side="right"
          :sideOffset="12">
          <template #trigger>
            <ScalarButton
              class="px-1 transition-none"
              size="sm"
              variant="ghost"
              @click.stop="deleteAllRows">
              Clear
              <span class="sr-only">All {{ title }}</span>
            </ScalarButton>
          </template>
          <template #content>
            <div
              class="grid gap-1.5 pointer-events-none min-w-48 w-content shadow-lg rounded bg-b-1 p-2 text-xxs leading-5 z-10 text-c-1">
              <div class="flex items-center text-c-2">
                <span>Clear optional parameters</span>
              </div>
            </div>
          </template>
        </ScalarTooltip>
      </div>
    </template>
    <div ref="tableWrapperRef">
      <!-- Read-only entries pinned to the top -->
      <RequestTable
        v-if="hasReadOnlyEntries"
        class="flex-1"
        :class="{
          'bg-mix-transparent bg-mix-amount-95 bg-c-3': hasReadOnlyEntries,
        }"
        :columns="['32px', '', '']"
        :envVariables="envVariables"
        :environment="environment"
        isGlobal
        isReadOnly
        :items="readOnlyEntries"
        :workspace="workspace" />
      <!-- Dynamic entries -->
      <RequestTable
        class="flex-1"
        :columns="['32px', '', '']"
        :envVariables="envVariables"
        :environment="environment"
        :items="params"
        :workspace="workspace"
        @toggleRow="toggleRow"
        @updateRow="updateRow" />
    </div>
  </ViewLayoutCollapse>
</template>
