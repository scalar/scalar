<script setup lang="ts">
import { ScalarButton, ScalarIcon } from '@scalar/components'
import type { Operation } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import DataTableCheckbox from '@/components/DataTable/DataTableCheckbox.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import ScriptEditor from './components/ScriptEditor.vue'

type PostResponseScript = {
  code: string
  enabled: boolean
  name?: string | undefined
}

const { operation } = defineProps<{
  operation: Operation
}>()

const { requestMutators } = useWorkspace()
const { activeEnvironment, activeEnvVariables, activeWorkspace } =
  useActiveEntities()

const scripts = computed(
  () => (operation['x-post-response'] || []) as PostResponseScript[],
)

const updatePostResponseScripts = (value: string, index: number) => {
  const newScripts = [...scripts.value]

  newScripts[index] = {
    code: value,
    enabled: newScripts[index]?.enabled ?? true,
    name: newScripts[index]?.name,
  }

  requestMutators.edit(operation.uid, 'x-post-response', newScripts)
}

const toggleEnabled = (index: number) => {
  const newScripts = [...scripts.value]
  newScripts[index] = {
    code: newScripts[index]?.code ?? '',
    enabled: !(newScripts[index]?.enabled ?? true),
    name: newScripts[index]?.name,
  }
  requestMutators.edit(operation.uid, 'x-post-response', newScripts)
}

const updateName = (name: string, index: number) => {
  const newScripts = [...scripts.value]
  newScripts[index] = {
    code: newScripts[index]?.code ?? '',
    enabled: newScripts[index]?.enabled ?? true,
    name,
  }
  requestMutators.edit(operation.uid, 'x-post-response', newScripts)
}

const addNewScript = () => {
  const newScript: PostResponseScript = { code: '', enabled: true, name: '' }
  const newScripts = [...scripts.value, newScript]
  requestMutators.edit(operation.uid, 'x-post-response', newScripts)
}

const removeScript = (index: number) => {
  const newScripts = scripts.value.filter(
    (_: PostResponseScript, i: number) => i !== index,
  )
  requestMutators.edit(operation.uid, 'x-post-response', newScripts)
}
</script>

<template>
  <div
    v-if="activeEnvironment && activeWorkspace"
    class="w-full">
    <ViewLayoutCollapse
      class="w-full"
      :defaultOpen="true">
      <template #title>Scripts</template>
      <template #actions>
        <!-- Show an indicator whether we have scripts -->
        <div class="mr-2">
          <div
            v-if="scripts.length > 0"
            class="bg-green h-2 w-2 rounded-full" />
        </div>
      </template>

      <div class="p-2">
        <div class="text-c-3 pb-2 text-sm">Post-Response</div>

        <ScriptEditor
          :modelValue="scripts[0]?.code ?? ''"
          @update:modelValue="updatePostResponseScripts($event, 0)" />
      </div>
    </ViewLayoutCollapse>
  </div>
</template>
