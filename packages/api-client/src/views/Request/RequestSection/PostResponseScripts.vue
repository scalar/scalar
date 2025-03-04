<script setup lang="ts">
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Operation } from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import type { CodeMirrorLanguage } from '@scalar/use-codemirror'
import { computed } from 'vue'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities, type EnvVariable } from '@/store/active-entities'

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
  <div class="post-response-scripts">
    <h2>Post Response Scripts</h2>

    <div
      v-for="(script, index) in scripts"
      :key="index"
      class="script-item">
      <div class="script-header">
        <div class="script-controls">
          <input
            :checked="script.enabled"
            type="checkbox"
            @change="toggleEnabled(index)" />
          <input
            placeholder="Script name (optional)"
            type="text"
            :value="script.name"
            @input="
              updateName(($event.target as HTMLInputElement).value, index)
            " />
          <button
            class="remove-btn"
            @click="removeScript(index)">
            Remove
          </button>
        </div>
      </div>

      <CodeInput
        v-if="activeEnvironment && activeWorkspace"
        :code="script.code"
        :envVariables="activeEnvVariables"
        :environment="activeEnvironment"
        language="html"
        :modelValue="script.code"
        :onChange="(value: string) => updatePostResponseScripts(value, index)"
        :workspace="activeWorkspace" />
    </div>

    <button
      class="add-btn"
      @click="addNewScript">
      Add New Script
    </button>
  </div>
</template>

<style scoped>
.post-response-scripts {
  padding: 1rem;
}

.script-item {
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
}

.script-header {
  margin-bottom: 0.5rem;
}

.script-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.remove-btn {
  background-color: #ff4444;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.add-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

input[type='text'] {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
