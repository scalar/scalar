<script lang="ts" setup generic="Value extends string">
/**
 * A native select drawn like the Theme picker, for the localhost shell's side panel. The select
 * fills its whole box, so every pixel inside the border opens it, and the box's ring is its only
 * focus ring. Text and caret sit on the same 12px inset as the Theme picker's.
 */
import { ScalarFormInput } from '@scalar/components/form'
import { ScalarIconCaretDown } from '@scalar/icons'

const { label, options } = defineProps<{
  /** Accessible name; the visible label is the form field's */
  label: string
  options: ReadonlyArray<{ value: Value; label: string }>
}>()

const model = defineModel<Value>()
</script>
<template>
  <ScalarFormInput
    is="div"
    class="relative p-0">
    <select
      v-model="model"
      :aria-label="label"
      class="text-c-1 w-full cursor-pointer appearance-none rounded-[inherit] border-0 bg-transparent py-3 ps-3 pe-9 outline-none">
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <ScalarIconCaretDown
      aria-hidden="true"
      class="text-c-2 pointer-events-none absolute end-3 size-3.5" />
  </ScalarFormInput>
</template>
