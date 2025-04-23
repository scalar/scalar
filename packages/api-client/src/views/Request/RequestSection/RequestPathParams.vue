<script setup lang="ts">
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Operation, RequestExample } from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { REGEX } from '@scalar/oas-utils/helpers'
import { computed, watch } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import type { EnvVariable } from '@/store/active-entities'
import RequestTable from '@/views/Request/RequestSection/RequestTable.vue'

const {
  example,
  operation,
  paramKey,
  title,
  environment,
  envVariables,
  workspace,
} = defineProps<{
  example: RequestExample
  operation: Operation
  paramKey: keyof RequestExample['parameters']
  title: string
  environment: Environment
  envVariables: EnvVariable[]
  workspace: Workspace
  invalidParams: Set<string>
}>()

const { requestMutators, requestExampleMutators } = useWorkspace()

const params = computed(() =>
  example.parameters[paramKey].map((param) => ({
    ...param,
    enum: param.enum,
  })),
)

/** Update a field in a parameter row */
const updateRow = (rowIdx: number, field: 'key' | 'value', value: string) => {
  const parameters = example.parameters[paramKey]
  const oldKey = parameters[rowIdx]?.key
  if (!oldKey) {
    return
  }

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
      const newPath = operation.path.replace(regx, '')

      requestMutators.edit(operation.uid, 'path', newPath)
    } else {
      /** Update URL with path params table key */
      const encodedOldKey = encodeURIComponent(oldKey)
      const encodedNewKey = encodeURIComponent(value)
      const regx = new RegExp(`(?<=/):${encodedOldKey}(?=[/?#]|$)`, 'g')
      const newPath = operation.path.replace(regx, `:${encodedNewKey}`)
      requestMutators.edit(operation.uid, 'path', newPath)
    }
  }

  requestExampleMutators.edit(
    example.uid,
    `parameters.${paramKey}.${rowIdx}.${field}`,
    value,
  )
}

const deleteRow = (rowIdx: number) => {
  const currentParams = params.value
  if (currentParams.length > rowIdx) {
    const updatedParams = [...currentParams]
    updatedParams.splice(rowIdx, 1)

    requestExampleMutators.edit(
      example.uid,
      `parameters.${paramKey}`,
      updatedParams,
    )
  }
}

const setPathVariable = (url: string) => {
  const pathVariables = url.match(REGEX.PATH)?.map((v) => v.slice(1, -1)) || []
  const parameters = example.parameters[paramKey]

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

  requestExampleMutators.edit(example.uid, `parameters.${paramKey}`, parameters)
}

const handlePathVariableUpdate = (url: string) => {
  if (url) {
    setPathVariable(url)
  }
}

watch(
  () => operation.path,
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
      :envVariables="envVariables"
      :environment="environment"
      :invalidParams="invalidParams"
      :items="params"
      :workspace="workspace"
      @updateRow="updateRow"
      @deleteRow="deleteRow" />
  </ViewLayoutCollapse>
</template>
