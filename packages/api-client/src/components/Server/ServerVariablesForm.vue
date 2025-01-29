<script setup lang="ts">
import ServerVariablesSelect from '@/components/Server/ServerVariablesSelect.vue'
import ServerVariablesTextbox from '@/components/Server/ServerVariablesTextbox.vue'
import type {
  ServerVariableValues,
  ServerVariables,
} from '@/components/Server/types'

const props = defineProps<{
  variables?: ServerVariables
  values?: ServerVariableValues
  /** The ID of the input controlled by the variables form */
  controls?: string
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
    props.variables?.[name]?.default ??
    ''
  ).toString()
}
</script>
<template>
  <template v-if="variables && Object.keys(variables ?? {}).length">
    <template
      v-for="name in Object.keys(variables)"
      :key="name">
      <label class="group/label flex w-full">
        <span
          class="flex items-center pl-3 py-1.5 after:content-[':'] mr-1.5 group-has-[input]/label:mr-0">
          {{ name }}
        </span>
        <template v-if="variables?.[name]?.enum?.length">
          <ServerVariablesSelect
            :controls="controls"
            :enum="variables[name]?.enum?.map((v) => `${v}`) ?? []"
            :label="name"
            :value="getVariable(name)"
            @change="(s) => setVariable(name, s)" />
        </template>
        <template v-else>
          <ServerVariablesTextbox
            :controls="controls"
            :value="getVariable(name)"
            @change="(s) => setVariable(name, s)" />
        </template>
      </label>
    </template>
  </template>
</template>
