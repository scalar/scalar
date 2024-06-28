<script setup lang="ts">
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store/workspace'
import RequestTable from '@/views/Request/RequestSection/RequestTable.vue'
import type { RequestExample } from '@scalar/oas-utils/entities/workspace/spec'
import { computed } from 'vue'

const props = defineProps<{
  title: string
  paramKey: keyof RequestExample['parameters']
}>()

const {
  activeRequest,
  activeExample,
  requestMutators,
  requestExampleMutators,
} = useWorkspace()

const params = computed(
  () => activeExample.value?.parameters[props.paramKey] ?? [],
)

/** Update a field in a parameter row */
const updateRow = (rowIdx: number, field: 'key' | 'value', value: string) => {
  if (!activeRequest.value || !activeExample.value) return

  const parameters = activeExample.value.parameters[props.paramKey]
  const oldKey = parameters[rowIdx]?.key

  /** Change variable in path as well */
  if (field === 'key') {
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
</script>
<template>
  <ViewLayoutCollapse :itemCount="params.length">
    <template #title>
      {{ title }}
    </template>

    <RequestTable
      v-if="params.length"
      class="flex-1"
      isEnabledHidden
      :items="params"
      @updateRow="updateRow" />

    <!-- Empty state -->
    <div
      v-else
      class="text-c-3 px-4 text-sm border rounded min-h-12 justify-center flex items-center bg-b-1 mx-1">
      You can use variables in your path:
      <code class="bg-b-2 ml-1 px-1 rounded">/endpoint/{my_path_variable}</code>
    </div>
  </ViewLayoutCollapse>
</template>
