<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { computed, ref } from 'vue'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import type { EnvVariable } from '@/store/active-entities'
import type { VueClassProp } from '@/types/vue'

import DataTableCell from './DataTableCell.vue'
import DataTableInputSelect from './DataTableInputSelect.vue'

const props = withDefaults(
  defineProps<{
    id?: string
    type?: string | undefined
    /** Class for the wrapping cell because attrs is bound to the input */
    containerClass?: VueClassProp | undefined
    required?: boolean
    modelValue: string | number
    /** Allows adding a custom value to the enum dropdown, defaults to true */
    canAddCustomEnumValue?: boolean
    readOnly?: boolean
    enum?: string[]
    min?: number
    max?: number
    environment: Environment
    envVariables: EnvVariable[]
    workspace: Workspace
    description?: string | undefined
    lineWrapping?: boolean
  }>(),
  {
    canAddCustomEnumValue: true,
    required: false,
    readOnly: false,
    lineWrapping: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'inputFocus'): void
  (e: 'inputBlur'): void
  (e: 'selectVariable', value: string): void
}>()

defineOptions({ inheritAttrs: false })

const mask = ref(true)
const interactingWithDropdown = ref(false)
const codeInput = ref<InstanceType<typeof CodeInput> | null>(null)

const handleBlur = () => {
  if (!interactingWithDropdown.value) {
    emit('inputBlur')
  }
}

const inputType = computed(() =>
  props.type === 'password' ? 'text' : (props.type ?? 'text'),
)

// If not an enum nor read only, focus the code input
const handleLabelClick = () => {
  if (!props.enum?.length && !props.readOnly) {
    codeInput.value?.focus()
  }
}
</script>
<template>
  <DataTableCell
    class="relative flex"
    :class="containerClass">
    <div
      v-if="$slots.default"
      class="text-c-1 flex items-center pr-0 pl-3"
      :for="id ?? ''"
      @click="handleLabelClick">
      <slot />:
    </div>
    <div class="relative flex min-w-0 flex-1">
      <template v-if="props.enum && props.enum.length">
        <DataTableInputSelect
          :canAddCustomValue="props.canAddCustomEnumValue"
          :modelValue="props.modelValue"
          :value="props.enum"
          @update:modelValue="emit('update:modelValue', $event)" />
      </template>
      <template v-else>
        <input
          v-if="mask && type === 'password'"
          v-bind="id ? { ...$attrs, id: id } : $attrs"
          autocomplete="off"
          class="text-c-1 disabled:text-c-2 peer w-full min-w-0 border-none px-2 py-1.25 -outline-offset-1"
          :class="{ 'scalar-password-input': type === 'password' }"
          data-1p-ignore
          :readOnly="readOnly"
          spellcheck="false"
          :type="inputType"
          :value="modelValue"
          @input="
            emit(
              'update:modelValue',
              ($event.target as HTMLInputElement).value ?? '',
            )
          " />
        <CodeInput
          v-else
          v-bind="$attrs"
          :id="id"
          ref="codeInput"
          class="text-c-1 disabled:text-c-2 peer w-full min-w-0 border-none -outline-offset-1"
          :class="[
            type === 'password' && description && 'pr-12',
            description && 'pr-8',
            type === 'password' && 'scalar-password-input',
          ]"
          :description="description"
          disableCloseBrackets
          disableTabIndent
          :envVariables="envVariables"
          :environment="environment"
          :lineWrapping="Boolean(lineWrapping)"
          :max="max"
          :min="min"
          :modelValue="modelValue ?? ''"
          :readOnly="readOnly"
          :required="Boolean(required)"
          spellcheck="false"
          :type="inputType"
          :workspace="workspace"
          @blur="handleBlur"
          @focus="emit('inputFocus')"
          @update:modelValue="emit('update:modelValue', $event)" />
      </template>
    </div>
    <div
      v-if="$slots.warning"
      class="centered-y text-orange absolute right-7 text-xs">
      <slot name="warning" />
    </div>
    <slot name="icon" />
    <ScalarIconButton
      v-if="type === 'password'"
      class="-ml-.5 mr-1.25 h-6 w-6 self-center p-1.25"
      :icon="mask ? 'Show' : 'Hide'"
      :label="mask ? 'Show Password' : 'Hide Password'"
      @click="mask = !mask" />
  </DataTableCell>
</template>

<style scoped>
:deep(.cm-editor) {
  padding: 0;
}
:deep(.cm-content) {
  align-items: center;
  background-color: transparent;
  display: flex;
  font-family: var(--scalar-font);
  font-size: var(--scalar-small);
  padding: 6px 8px;
  width: 100%;
}
:deep(.cm-content):has(.cm-pill) {
  padding: 6px 8px;
}
:deep(.cm-content .cm-pill:not(:last-of-type)) {
  margin-right: 0.5px;
}
:deep(.cm-content .cm-pill:not(:first-of-type)) {
  margin-left: 0.5px;
}
:deep(.cm-line) {
  overflow: hidden;
  padding: 0;
  text-overflow: ellipsis;
}
.required::after {
  content: 'Required';
}
/* Tailwind placeholder is busted */
input::placeholder {
  color: var(--scalar-color-3);
}
/* we want our inputs to look like a password input but not be one */
.scalar-password-input {
  text-security: disc;
  -webkit-text-security: disc;
  -moz-text-security: disc;
}
</style>
