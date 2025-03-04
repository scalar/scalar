<script setup lang="ts">
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import type { EnvVariable } from '@/store/active-entities'

import type { PostResponseScript } from '../types/post-response'

const props = defineProps<{
  script: PostResponseScript
  index: number
  environment: Environment
  envVariables: EnvVariable[]
  workspace: Workspace
}>()

const emit = defineEmits<{
  (e: 'update', script: PostResponseScript): void
  (e: 'toggleEnabled', enabled: boolean): void
  (e: 'updateName', name: string): void
}>()

const updateCode = (value: string) => {
  emit('update', {
    ...props.script,
    code: value,
  })
}

const toggleEnabled = () => {
  emit('toggleEnabled', !props.script.enabled)
}

const updateName = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  emit('updateName', value)
}
</script>

<template>
  <div class="script-item">
    <div class="script-header">
      <div class="script-controls">
        <input
          :checked="script.enabled"
          type="checkbox"
          @change="toggleEnabled" />
        <input
          placeholder="Script name (optional)"
          type="text"
          :value="script.name"
          @input="updateName" />
      </div>
    </div>

    <CodeInput
      v-if="environment && workspace"
      :code="script.code"
      :envVariables="envVariables"
      :environment="environment"
      language="html"
      :modelValue="script.code"
      :onChange="updateCode"
      :workspace="workspace" />
  </div>
</template>

<style scoped>
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

input[type='text'] {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
