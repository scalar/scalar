<script setup lang="ts">
import { type Variable, useServerStore } from '@scalar/api-client'

import ServerVariableSelect from './ServerVariableSelect.vue'
import ServerVariableTextbox from './ServerVariableTextbox.vue'

defineProps<{ value?: Variable[] }>()

const { server, setServer } = useServerStore()

const setVariable = (name: string, newValue: string) => {
  const newVariables = [...server.variables]
  const index = newVariables.findIndex((variable) => variable.name === name)

  newVariables[index].value = newValue

  setServer({
    variables: newVariables,
  })
}
</script>
<template>
  <div
    v-if="value"
    class="variable-container">
    <template
      v-for="variable in value"
      :key="variable.name">
      <div class="variable-container-item">
        <label
          class="variable-description"
          :for="`variable-${variable.name}`">
          <code>{{ variable.name }}</code>
        </label>
        <ServerVariableSelect
          v-if="variable.enum && variable.enum.length"
          :enum="variable.enum.map((v) => `${v}`)"
          :value="variable.value"
          @change="(s) => setVariable(variable.name, s)" />
        <ServerVariableTextbox
          v-else
          :value="variable.value"
          @change="(s) => setVariable(variable.name, s)" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.variable-container-item {
  display: flex;
  width: 100%;
}
.variable-description {
  padding: 9px 0 9px 9px;
  color: var(--scalar-color-2);
  border-top: 1px solid var(--scalar-border-color);
  font-size: var(--scalar-micro);
}
.variable-description:after {
  content: ':';
  margin-right: 6px;
}
.variable-description :deep(.markdown) {
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color--1);
  padding: 4px 0;
  display: block;
}
.variable-description :deep(.markdown > *:first-child) {
  margin-top: 0;
}
</style>
