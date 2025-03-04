<script setup lang="ts">
import { ScalarButton, ScalarIcon } from '@scalar/components'
import type { Operation } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTableCheckbox from '@/components/DataTable/DataTableCheckbox.vue'
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

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
      :defaultOpen="false">
      <template #title>Post Response Script</template>
      <template #actions>
        <ScalarButton
          class="text-c-1 hover:bg-b-3 py-0.75 flex h-full w-fit gap-1.5 px-1.5 font-normal"
          fullWidth
          variant="ghost"
          @click="addNewScript">
          <span>Create Script</span>
          <ScalarIcon
            icon="Add"
            size="md" />
        </ScalarButton>
      </template>

      <div
        v-for="(script, index) in scripts"
        :key="index"
        class="flex flex-col gap-2">
        <div class="flex gap-2 p-2">
          <DataTableCheckbox
            class="border-l-1/2 border-b-1/2"
            :modelValue="script.enabled"
            @update:modelValue="toggleEnabled(index)" />

          <div class="border-1/2 w-full">
            <DataTableInput
              class="border-none"
              :envVariables="activeEnvVariables"
              :environment="activeEnvironment"
              :modelValue="script.name ?? ''"
              placeholder="Name (optional)"
              :workspace="activeWorkspace"
              @update:modelValue="updateName($event, index)" />
          </div>
        </div>

        <div class="p-2">
          <CodeInput
            v-if="activeEnvironment && activeWorkspace"
            class="border-1/2"
            :code="script.code"
            :envVariables="activeEnvVariables"
            :environment="activeEnvironment"
            language="html"
            :modelValue="script.code"
            placeholder="Script"
            :workspace="activeWorkspace"
            @update:modelValue="updatePostResponseScripts($event, index)" />
        </div>

        <ScalarButton
          class="m-2"
          variant="outlined"
          @click="removeScript(index)">
          Remove
        </ScalarButton>
      </div>
    </ViewLayoutCollapse>
  </div>
</template>
