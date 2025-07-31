<script setup lang="ts">
import ServerVariablesSelect from '@/components/Server/ServerVariablesSelect.vue'
import ServerVariablesTextbox from '@/components/Server/ServerVariablesTextbox.vue'
import type {
  ServerVariables,
  ServerVariableValues,
} from '@/components/Server/types'

const {
  values,
  variables,
  layout = 'client',
} = defineProps<{
  variables?: ServerVariables | undefined
  values?: ServerVariableValues
  /** The ID of the input controlled by the variables form */
  controls?: string
  /** The layout of the server variables form */
  layout?: 'client' | 'reference'
}>()

const emit = defineEmits<{
  (e: 'update:variable', name: string, value: string): void
}>()

function setVariable(name: string, value: string) {
  emit('update:variable', name, value)
}

const getVariable = (name: string) => {
  return (values?.[name] ?? variables?.[name]?.default ?? '').toString()
}
</script>
<template>
  <template v-if="variables && Object.keys(variables ?? {}).length">
    <template
      v-for="name in Object.keys(variables)"
      :key="name">
      <label
        class="group/label flex w-full"
        :class="
          layout === 'reference' &&
          'items-center border-x border-b last:rounded-b-lg'
        ">
        <span
          class="flex items-center py-1.5 pl-3 group-has-[input]/label:mr-0 after:content-[':']">
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
