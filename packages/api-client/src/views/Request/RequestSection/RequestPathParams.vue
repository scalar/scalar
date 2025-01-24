<script setup lang="ts">
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import RequestTable from '@/views/Request/RequestSection/RequestTable.vue'
import type { RequestExample } from '@scalar/oas-utils/entities/spec'
import { REGEX } from '@scalar/oas-utils/helpers'
import { computed, watch } from 'vue'

const props = defineProps<{
  title: string
  paramKey: keyof RequestExample['parameters']
}>()

const { activeRequest, activeExample } = useActiveEntities()
const { requestMutators, requestExampleMutators } = useWorkspace()

const params = computed(() => {
  const example = activeExample.value
  if (!example) return []

  return example.parameters[props.paramKey].map((param) => ({
    ...param,
    enum: param.enum,
  }))
})

/** Update a field in a parameter row */
const updateRow = (rowIdx: number, field: 'key' | 'value', value: string) => {
  if (!activeRequest.value || !activeExample.value) return

  const parameters = activeExample.value.parameters[props.paramKey]
  const oldKey = parameters[rowIdx]?.key
  if (!oldKey) return

  /** Change variable in path as well */
  if (field === 'key') {
    if (parameters[rowIdx]?.required) {
      /** Prevent updating the key of a required item */
      return
    }
    if (!value) {
      /** Remove parameter if path params table key is empty */
      parameters.splice(rowIdx, 1)
      const regx = new RegExp(`/:${encodeURIComponent(oldKey)}(?=[/?#]|$)`, 'g')
      const newPath = activeRequest.value.path.replace(regx, '')

      requestMutators.edit(activeRequest.value.uid, 'path', newPath)
    } else {
      /** Update URL with path params table key */
      const encodedOldKey = encodeURIComponent(oldKey)
      const encodedNewKey = encodeURIComponent(value)
      const regx = new RegExp(`(?<=/):${encodedOldKey}(?=[/?#]|$)`, 'g')
      const newPath = activeRequest.value.path.replace(
        regx,
        `:${encodedNewKey}`,
      )
      requestMutators.edit(activeRequest.value.uid, 'path', newPath)
    }
  }

  requestExampleMutators.edit(
    activeExample.value.uid,
    `parameters.${props.paramKey}.${rowIdx}.${field}`,
    value,
  )
}

const setPathVariable = (url: string) => {
  if (!activeExample.value) return

  const pathVariables = url.match(REGEX.PATH)?.map((v) => v.slice(1, -1)) || []
  const parameters = activeExample.value.parameters[props.paramKey]

  const paramMap = new Map(parameters.map((param) => [param.key, param]))
  const updatedParameters = pathVariables.map(
    (key) => paramMap.get(key) || { key, value: '', enabled: true },
  )

  parameters.forEach((param) => {
    /** prevent removing required parameters or with a value */
    if (!pathVariables.includes(param.key) && (param.value || param.required)) {
      updatedParameters.push(param)
    }
  })

  parameters.splice(0, parameters.length, ...updatedParameters)

  // if (pathVariables.length === 0) {
  //   parameters.splice(0, parameters.length)
  // }

  requestExampleMutators.edit(
    activeExample.value.uid,
    `parameters.${props.paramKey}`,
    parameters,
  )
}

const handlePathVariableUpdate = (url: string) => {
  if (url) {
    setPathVariable(url)
  }
}

watch(
  () => activeRequest.value?.path,
  (newURL) => {
    if (newURL) {
      handlePathVariableUpdate(newURL)
    }
  },
)
</script>
<template>
  <ViewLayoutCollapse :itemCount="params.length">
    <template #title>
      {{ title }}
    </template>

    <RequestTable
      v-if="params.length"
      class="flex-1"
      :columns="['32px', '', '']"
      hasCheckboxDisabled
      :items="params"
      @updateRow="updateRow" />
  </ViewLayoutCollapse>
</template>
