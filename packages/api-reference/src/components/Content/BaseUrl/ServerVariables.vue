<script setup lang="ts">
import { type Variable, useServerStore } from '@scalar/api-client'
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components'
import { computed } from 'vue'

defineProps<{ value?: Variable[] }>()

const { server, setServer } = useServerStore()

const handleInput = (name: string, newValue: string) => {
  const newVariables = [...server.variables]
  const index = newVariables.findIndex((variable) => variable.name === name)

  newVariables[index].value = newValue

  setServer({
    variables: newVariables,
  })
}

const getValue = (name: string) => {
  const index = server.variables.findIndex(
    (variable: Variable) => variable.name === name,
  )

  return server.variables[index]?.value ?? ''
}

const enumOptions = (variable: Variable) =>
  variable.enum?.map((enumValue: string | number) => ({
    id: String(enumValue),
    label: String(enumValue),
  })) ?? []

const selectedEnum = (variable: Variable) =>
  computed({
    get: () =>
      enumOptions(variable).find(
        ({ id }: { id: string }) => id === getValue(variable.name),
      ) ?? null,
    set: (opt: ScalarListboxOption | null) =>
      opt?.id && handleInput(variable.name, opt.id),
  })
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
        <template v-if="variable.enum && variable.enum.length">
          <div class="w-full">
            <ScalarListbox
              :id="`variable-${variable.name}`"
              v-model="selectedEnum(variable).value"
              :options="enumOptions(variable)">
              <ScalarButton
                class="variable-value"
                fullWidth
                variant="ghost">
                <span>
                  {{ selectedEnum(variable).value?.label ?? 'Select a value' }}
                </span>
                <ScalarIcon
                  icon="ChevronDown"
                  size="xs" />
              </ScalarButton>
            </ScalarListbox>
          </div>
        </template>
        <template v-else>
          <input
            :id="`variable-${variable.name}`"
            autocomplete="off"
            class="variable-value"
            placeholder="value"
            spellcheck="false"
            type="text"
            :value="getValue(variable.name)"
            @input="
              (event) =>
                handleInput(
                  variable.name,
                  (event.target as HTMLInputElement).value,
                )
            " />
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
.variable-description {
  padding: 9px 0 9px 9px;
  color: var(--scalar-color-2);
}
.variable-value {
  padding: 9px 9px 9px 0;
  color: var(--scalar-color-1);
}
.variable-description:after {
  content: ':';
  margin-right: 6px;
}
.variable-value {
  align-items: center;
  border-color: transparent;
  border-radius: 0;
  border-top: 1px solid var(--scalar-border-color);
  display: flex;
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-regular);
  gap: 3px;
  height: auto;
  outline: none;
  width: 100%;
}
.variable-value svg {
  color: var(--scalar-color-2);
  stroke-width: 1;
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
</style>
