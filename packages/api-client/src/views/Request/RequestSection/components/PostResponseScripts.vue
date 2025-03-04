<script setup lang="ts">
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'

import type { EnvVariable } from '@/store/active-entities'

import type {
  PostResponseScript,
  PostResponseScriptsProps,
} from '../types/post-response'
import PostResponseScriptComponent from './PostResponseScript.vue'

const props = defineProps<
  PostResponseScriptsProps & {
    environment: Environment
    envVariables: EnvVariable[]
    workspace: Workspace
  }
>()

const addNewScript = () => {
  const newScript: PostResponseScript = { code: '', enabled: true, name: '' }
  props.onUpdate([...(props.scripts || []), newScript])
}

const removeScript = (index: number) => {
  if (!props.scripts) return
  const newScripts = props.scripts.filter((_, i) => i !== index)
  props.onUpdate(newScripts)
}

const updateScript = (index: number, script: PostResponseScript) => {
  if (!props.scripts) return
  const newScripts = [...props.scripts]
  newScripts[index] = script
  props.onUpdate(newScripts)
}

const toggleEnabled = (index: number, enabled: boolean) => {
  if (!props.scripts) return
  const script = props.scripts[index]
  if (!script) return

  const newScripts = [...props.scripts]
  newScripts[index] = {
    ...script,
    enabled,
  }
  props.onUpdate(newScripts)
}

const updateName = (index: number, name: string) => {
  if (!props.scripts) return
  const script = props.scripts[index]
  if (!script) return

  const newScripts = [...props.scripts]
  newScripts[index] = {
    ...script,
    name,
  }
  props.onUpdate(newScripts)
}
</script>

<template>
  <div class="post-response-scripts">
    <div
      v-for="(script, index) in scripts"
      :key="index">
      <PostResponseScriptComponent
        :envVariables="envVariables"
        :environment="environment"
        :index="index"
        :script="script"
        :workspace="workspace"
        @toggleEnabled="(enabled) => toggleEnabled(index, enabled)"
        @update="(script) => updateScript(index, script)"
        @updateName="(name) => updateName(index, name)" />
      <button
        class="delete-btn"
        @click="removeScript(index)">
        Delete Script
      </button>
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

.add-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

.delete-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}
</style>
