<script lang="ts">
/**
 * Scalar Text Input component
 *
 * A wrapper around the HTML input element with a focusable container.
 *
 * @example
 *   <ScalarTextInput v-model="model" />
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { onMounted, ref } from 'vue'

const model = defineModel<string>()

const input = ref<HTMLInputElement>()

defineOptions({ inheritAttrs: false })
const { classCx, otherAttrs } = useBindCx()

onMounted(() => {
  // Force autofocus if the input has the autofocus attribute
  if ('autofocus' in otherAttrs.value) input.value?.focus()
})
</script>
<template>
  <div
    v-bind="
      classCx(
        'bg-b-1.5 flex cursor-text items-center gap-0.75 rounded-md border px-3 py-2.5 outline-offset-[-1px] focus-within:bg-b-1 has-[input:focus-visible]:outline',
      )
    "
    @click="input?.focus()">
    <div class="flex flex-1 relative">
      <span
        v-if="$slots.prefix"
        class="select-none whitespace-nowrap text-sm text-transparent">
        <slot name="prefix" />
      </span>
      <input
        ref="input"
        v-model="model"
        class="z-1 min-w-0 flex-1 border-none bg-transparent text-sm placeholder:font-[inherit] focus-within:outline-none"
        v-bind="otherAttrs" />
      <div
        v-if="$slots.prefix || $slots.suffix"
        class="absolute inset-0 select-none overflow-hidden whitespace-nowrap text-sm">
        <span
          v-if="$slots.prefix"
          class="text-c-2">
          <slot name="prefix" />
        </span>
        <span class="text-transparent">{{ model || $attrs.placeholder }}</span>
        <span
          v-if="$slots.suffix"
          class="text-c-2">
          <slot name="suffix" />
        </span>
      </div>
    </div>
    <slot name="aside" />
  </div>
</template>
