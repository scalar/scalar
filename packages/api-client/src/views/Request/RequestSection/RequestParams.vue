<script setup lang="ts">
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import RequestTable from '@/views/Request/RequestSection/RequestTable.vue'
import { ScalarButton } from '@scalar/components'
import {
  type RequestExample,
  requestExampleParametersSchema,
} from '@scalar/oas-utils/entities/spec'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  title: string
  paramKey: keyof RequestExample['parameters']
}>()

const { activeRequest, activeExample } = useActiveEntities()
const { requestExampleMutators } = useWorkspace()

const params = computed(
  () => activeExample.value?.parameters[props.paramKey] ?? [],
)

onMounted(() => {
  defaultRow()
})

/** Add a new row to a given parameter list */
const addRow = () => {
  if (!activeRequest.value || !activeExample.value) return

  /** Create a new parameter instance with 'enabled' set to false */
  const newParam = requestExampleParametersSchema.parse({ enabled: false })
  const newParams = [...params.value, newParam]

  requestExampleMutators.edit(
    activeExample.value.uid,
    `parameters.${props.paramKey}`,
    newParams,
  )
}

const tableWrapperRef = ref<HTMLInputElement | null>(null)

/** Update a field in a parameter row */
const updateRow = (rowIdx: number, field: 'key' | 'value', value: string) => {
  if (!activeRequest.value || !activeExample.value) return

  const currentParams = params.value
  if (currentParams.length > rowIdx) {
    const updatedParams = [...currentParams]
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
      activeExample.value.uid,
      `parameters.${props.paramKey}`,
      updatedParams,
    )
  } else {
    /** if there is no row at the index, add a new one */
    const payload = [requestExampleParametersSchema.parse({ [field]: value })]
    requestExampleMutators.edit(
      activeExample.value.uid,
      `parameters.${props.paramKey}`,
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
  activeRequest.value &&
  activeExample.value &&
  requestExampleMutators.edit(
    activeExample.value.uid,
    `parameters.${props.paramKey}.${rowIdx}.enabled`,
    enabled,
  )

const deleteAllRows = () => {
  if (!activeRequest.value || !activeExample.value) return

  // filter out params that are enabled or required
  const exampleParams = params.value.filter(
    (param) => param.enabled || param.required,
  )

  requestExampleMutators.edit(
    activeExample.value.uid,
    `parameters.${props.paramKey}`,
    exampleParams,
  )

  nextTick(() => {
    /** ensure one empty row after deleting all rows */
    addRow()
  })
}

function defaultRow() {
  /** ensure one empty row by default */
  if (params.value.length === 0) {
    addRow()
  } else if (params.value.length >= 1) {
    /** ensure we always have a trailing empty row */
    const lastParam = params.value[params.value.length - 1]
    if (lastParam.key !== '' && lastParam.value !== '') {
      addRow()
    }
  }
}

const itemCount = computed(
  () => params.value.filter((param) => param.key || param.value).length,
)

watch(
  () => activeExample.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      defaultRow()
    }
  },
  { immediate: true },
)
</script>
<template>
  <ViewLayoutCollapse
    class="group/params"
    :itemCount="itemCount">
    <template #title>{{ title }}</template>
    <template #actions>
      <div
        class="text-c-2 flex whitespace-nowrap opacity-0 group-hover/params:opacity-100 has-[:focus-visible]:opacity-100 request-meta-buttons">
        <ScalarButton
          class="px-1 transition-none"
          size="sm"
          variant="ghost"
          @click.stop="deleteAllRows">
          Clear<span class="sr-only">All {{ title }}</span>
        </ScalarButton>
      </div>
    </template>
    <div ref="tableWrapperRef">
      <RequestTable
        class="flex-1"
        :columns="['32px', '', '']"
        :items="params"
        @toggleRow="toggleRow"
        @updateRow="updateRow" />
    </div>
  </ViewLayoutCollapse>
</template>
