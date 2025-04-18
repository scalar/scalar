<script setup lang="ts">
import { RadioGroup, RadioGroupLabel, RadioGroupOption } from '@headlessui/vue'
import { ScalarPopover } from '@scalar/components'
import { LibraryIcon, libraryIcons } from '@scalar/icons/library'
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  placement?: AlignedPlacement
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', icon: string): void
}>()

type Side = 'top' | 'bottom'
type Alignment = 'start' | 'end'
type AlignedPlacement = `${Side}-${Alignment}`

const value = computed<string>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
<template>
  <ScalarPopover
    class="bg-b-2 rounded"
    focus
    :placement="placement ?? 'bottom'">
    <slot />
    <template #popover="{ close }">
      <RadioGroup
        v-model="value"
        class="flex flex-col">
        <div class="flex text-sm">
          <RadioGroupLabel class="text-c-2 px-1 py-1">
            <slot name="title">Select an icon</slot>
          </RadioGroupLabel>
        </div>
        <ul
          class="bg-b-1 custom-scroll grid w-dvw max-w-[420px] auto-rows-[32px] grid-cols-[repeat(auto-fill,minmax(32px,1fr))] content-between justify-between rounded border p-1">
          <RadioGroupOption
            v-for="icon in libraryIcons"
            :key="icon.src"
            as="li"
            class="text-c-3 hover:text-c-2 hover:bg-b-2 ui-checked:bg-b-3 ui-active:bg-b-2 flex cursor-pointer items-center justify-center rounded p-2"
            :value="icon.src"
            @click="close">
            <RadioGroupLabel class="sr-only">
              {{ icon.src.replaceAll('-', ' ') }} Icon
            </RadioGroupLabel>
            <LibraryIcon
              class="stroke-[1.5]"
              :src="icon.src" />
          </RadioGroupOption>
        </ul>
      </RadioGroup>
    </template>
  </ScalarPopover>
</template>
