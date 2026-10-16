<script setup lang="ts">
import { useId, type VNode } from 'vue'

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

/** Optional read-only context for individual variables, kept separate from their editable values. */
const slots = defineSlots<{
  [name: `hint-${string}`]: () => VNode[]
}>()

const id = useId()

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
      <div
        class="group/label w-full"
        :class="
          layout === 'reference' && 'border-x border-b last:rounded-b-lg'
        ">
        <div class="flex h-8 w-full items-center">
          <label
            class="flex items-center py-2 pl-3 group-has-[input]/label:mr-0 after:content-[':']"
            :for="`${id}-${name}`">
            {{ name }}
          </label>
          <template v-if="variables?.[name]?.enum?.length">
            <ServerVariablesSelect
              :id="`${id}-${name}`"
              :controls="controls"
              :describedBy="
                slots[`hint-${name}`] ? `${id}-${name}-hint` : undefined
              "
              :enum="variables[name]?.enum?.map((v) => `${v}`) ?? []"
              :value="getVariable(name)"
              @change="(s) => setVariable(name, s)" />
          </template>
          <template v-else>
            <ServerVariablesTextbox
              :id="`${id}-${name}`"
              :aria-describedby="
                slots[`hint-${name}`] ? `${id}-${name}-hint` : undefined
              "
              :controls="controls"
              :value="getVariable(name)"
              @change="(s) => setVariable(name, s)" />
          </template>
        </div>
        <div
          v-if="slots[`hint-${name}`]"
          :id="`${id}-${name}-hint`"
          class="text-c-2 px-3 pb-2 text-sm">
          <slot :name="`hint-${name}`" />
        </div>
      </div>
    </template>
  </template>
</template>
