<script setup lang="ts">
import { cva, cx, ScalarButton } from '@scalar/components'
import { ScalarIconCheck } from '@scalar/icons'

defineProps<{
  colorMode: 'system' | 'light' | 'dark'
}>()

const emit = defineEmits<{
  (e: 'update:colorMode', value: 'system' | 'light' | 'dark'): void
}>()

const buttonStyles = cva({
  base: 'w-full shadow-none text-c-1 justify-start pl-2 gap-2 border',
  variants: {
    active: {
      true: 'bg-primary text-c-1 hover:bg-inherit',
      false: 'bg-b-1 hover:bg-b-2',
    },
  },
})
</script>
<template>
  <div class="flex flex-col gap-2">
    <ScalarButton
      :class="cx(buttonStyles({ active: colorMode === 'system' }))"
      @click="emit('update:colorMode', 'system')">
      <div
        class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
        :class="{
          'bg-c-accent text-b-1 border-transparent': colorMode === 'system',
        }">
        <ScalarIconCheck
          v-if="colorMode === 'system'"
          size="xs"
          thickness="3.5" />
      </div>
      System Preference (default)
    </ScalarButton>
    <ScalarButton
      :class="cx(buttonStyles({ active: colorMode === 'light' }))"
      @click="emit('update:colorMode', 'light')">
      <div
        class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
        :class="{
          'bg-c-accent text-b-1 border-transparent': colorMode === 'light',
        }">
        <ScalarIconCheck
          v-if="colorMode === 'light'"
          size="xs"
          thickness="3.5" />
      </div>
      Light Mode Always
    </ScalarButton>
    <ScalarButton
      :class="cx(buttonStyles({ active: colorMode === 'dark' }))"
      @click="emit('update:colorMode', 'dark')">
      <div
        class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
        :class="{
          'bg-c-accent text-b-1 border-transparent': colorMode === 'dark',
        }">
        <ScalarIconCheck
          v-if="colorMode === 'dark'"
          size="xs"
          thickness="3.5" />
      </div>
      Dark Mode Always
    </ScalarButton>
  </div>
</template>
