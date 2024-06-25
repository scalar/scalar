<script setup lang="ts">
import { type Variable, useServerStore } from '@scalar/api-client'

defineProps<{ value?: Variable[] }>()

const { server, setServer } = useServerStore()

const handleInput = (name: string, event: Event) => {
  const newValue = (event.target as HTMLSelectElement).value
  const newVariables = [...server.variables]
  const index = newVariables.findIndex((variable) => variable.name === name)

  newVariables[index].value = newValue

  setServer({
    variables: newVariables,
  })
}

const getValue = (name: string) => {
  const index = server.variables.findIndex((variable) => variable.name === name)

  return server.variables[index].value ?? ''
}
</script>
<template>
  <div
    v-if="value"
    class="variable-container">
    <template
      v-for="variable in value"
      :key="variable.name">
      <label
        class="variable-description"
        :for="`variable-${variable.name}`">
        <code>{{ variable.name }}</code>
      </label>
      <template v-if="variable.enum">
        <select
          :id="`variable-${variable.name}`"
          :value="getValue(variable.name)"
          @input="(event) => handleInput(variable.name, event)">
          <option
            v-for="enumValue in variable.enum"
            :key="enumValue"
            :value="enumValue">
            {{ enumValue }}
          </option>
        </select>
        <div class="input-value">
          {{ variable.default }}
        </div>
      </template>
      <template v-else>
        <input
          :id="`variable-${variable.name}`"
          autocomplete="off"
          class="input-value"
          placeholder="value"
          spellcheck="false"
          type="text"
          :value="getValue(variable.name)"
          @input="(event) => handleInput(variable.name, event)" />
      </template>
    </template>
  </div>
</template>

<style scoped>
.variable-container {
  display: grid;
  grid-template-columns: min-content 1fr;
}
.input select {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
}
.variable-description,
.input-value {
  padding: 9px;
}
.input-value {
  border-color: transparent;
  border-radius: 0;
  border-left: 1px solid var(--scalar-border-color);
  border-top: 1px solid var(--scalar-border-color);
  color: var(--scalar-color-1);
  font-size: var(--scalar-micro);
  outline: none;
}

.variable-description {
  border-top: 1px solid var(--scalar-border-color);
  font-size: var(--scalar-micro);
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
.input {
  align-items: center;
}
</style>
