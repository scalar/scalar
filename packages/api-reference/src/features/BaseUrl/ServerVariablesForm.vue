<script setup lang="ts">
import ServerVariableSelect from './ServerVariableSelect.vue'
import ServerVariableTextbox from './ServerVariableTextbox.vue'
import type { ServerVariableValues, ServerVariables } from './types'

const props = defineProps<{
  variables?: ServerVariables
  values?: ServerVariableValues
}>()

const emit = defineEmits<{
  (e: 'update:variable', name: string, value: string): void
}>()

function setVariable(name: string, value: string) {
  emit('update:variable', name, value)
}

const getVariable = (name: string) => {
  return (
    props.values?.[name] ??
    props.variables?.[name].default ??
    ''
  ).toString()
}
</script>
<template>
  <div
    v-if="variables && Object.keys(variables ?? {}).length"
    class="variable-container">
    <template
      v-for="name in Object.keys(variables)"
      :key="name">
      <div class="variable-container-item">
        <label :for="`variable-${name}`">
          <code>{{ name }}</code>
        </label>

        <template v-if="variables?.[name].enum?.length">
          <ServerVariableSelect
            :enum="variables[name]?.enum?.map((v) => `${v}`) ?? []"
            :value="getVariable(name)"
            @change="(s) => setVariable(name, s)" />
        </template>
        <template v-else>
          <ServerVariableTextbox
            :value="getVariable(name)"
            @change="(s) => setVariable(name, s)" />
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.variable-container-item {
  display: flex;
  width: 100%;
}
</style>
