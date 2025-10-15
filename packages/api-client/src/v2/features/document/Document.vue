<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'

import LabelInput from '@/components/Form/LabelInput.vue'
import IconSelector from '@/components/IconSelector.vue'

import Tabs, { type Routes } from './components/Tabs.vue'

const { icon = 'interface-content-folder' } = defineProps<{
  /** Currently selected tab */
  selectedTab: Routes
  /** Document icon */
  icon?: string
  /** Document title */
  title: string
}>()

const emit = defineEmits<{
  (e: 'update:selectedTab', value: Routes): void
  (e: 'update:documentTitle', value: string): void
  (e: 'update:documentIcon', value: string): void
}>()
</script>

<template>
  <div class="w-full md:mx-auto md:max-w-[720px]">
    <div
      :aria-label="`Document: ${title}`"
      class="mx-auto flex h-fit w-full flex-col gap-2 pt-6 pb-3 md:mx-auto md:max-w-[720px]">
      <IconSelector
        :modelValue="icon"
        placement="bottom-start"
        @update:modelValue="(value) => emit('update:documentIcon', value)">
        <ScalarButton
          class="hover:bg-b-2 aspect-square h-7 w-7 cursor-pointer rounded border border-transparent p-0 hover:border-inherit"
          variant="ghost">
          <LibraryIcon
            class="text-c-2 size-5"
            :src="icon"
            stroke-width="2" />
        </ScalarButton>
      </IconSelector>
      <div class="group relative ml-1.25">
        <LabelInput
          class="text-xl font-bold"
          inputId="documentName"
          placeholder="Untitled Document"
          :value="title"
          @updateValue="(value) => emit('update:documentTitle', value)" />
      </div>
    </div>
    <Tabs
      :selectedTab="selectedTab"
      @update:selectedTab="(tab) => emit('update:selectedTab', tab)" />
  </div>
</template>
