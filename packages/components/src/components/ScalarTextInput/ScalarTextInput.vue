<script setup lang="ts">
import { ref } from 'vue'

import { useBindCx } from '../../hooks/useBindCx'

const model = defineModel<string>()

const input = ref<HTMLInputElement>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    class="bg-b-1.5 flex cursor-text items-center gap-0.75 rounded-md border px-3 py-2.5 outline-offset-[-1px] focus-within:bg-b-1 has-[input:focus-visible]:outline"
    @click="input?.focus()">
    <div class="flex flex-1 gap-2 font-normal">
      <div class="flex flex-1 flex-col gap-0.75">
        <div class="relative flex">
          <span
            v-if="$slots.prefix"
            class="select-none whitespace-nowrap text-sm text-transparent">
            <slot name="prefix" />
          </span>
          <input
            ref="input"
            v-model="model"
            v-bind="
              cx(
                'z-1 min-w-0 flex-1 border-none bg-transparent text-sm placeholder:font-[inherit] focus-within:outline-none',
              )
            " />
          <div
            v-if="$slots.prefix || $slots.suffix"
            class="absolute inset-0 select-none overflow-hidden whitespace-nowrap text-sm">
            <span
              v-if="$slots.prefix"
              class="text-c-2">
              <slot name="prefix" />
            </span>
            <span class="text-transparent">{{
              model || $attrs.placeholder
            }}</span>
            <span
              v-if="$slots.suffix"
              class="text-c-2">
              <slot name="suffix" />
            </span>
          </div>
        </div>
      </div>
      <slot name="aside" />
    </div>
  </div>
</template>
