<script setup lang="ts">
import ServerVariablesSelect from './ServerVariablesSelect.vue'
import ServerVariablesTextbox from './ServerVariablesTextbox.vue'
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
        <label
          class="variable-label"
          :for="`variable-${name}`">
          <code>{{ name }}</code>
        </label>

        <template v-if="variables?.[name].enum?.length">
          <ServerVariablesSelect
            :enum="variables[name]?.enum?.map((v) => `${v}`) ?? []"
            :value="getVariable(name)"
            @change="(s) => setVariable(name, s)" />
        </template>
        <template v-else>
          <ServerVariablesTextbox
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

.variable-label {
  padding: 9px 0 9px 9px;
  color: var(--scalar-color-2);
  border-top: 1px solid var(--scalar-border-color);
  font-size: var(--scalar-micro);
}
.variable-label:after {
  content: ':';
  margin-right: 6px;
}
</style>
