<script lang="ts" setup>
import { ScalarListbox, type ScalarListboxOption } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import { computed } from 'vue'

import type {
  DiscriminatorMapping,
  DiscriminatorPropertyName,
} from './helpers/schema-discriminator'

const { discriminatorMapping, modelValue, discriminatorPropertyName } =
  defineProps<{
    discriminatorMapping: DiscriminatorMapping
    modelValue: string
    discriminatorPropertyName?: DiscriminatorPropertyName
  }>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const listboxOptions = computed(() =>
  Object.keys(discriminatorMapping).map((type) => ({
    id: type,
    label: type,
  })),
)

const selectedOption = computed({
  get: () =>
    listboxOptions.value.find(
      (opt: ScalarListboxOption) => opt.id === modelValue,
    ),
  set: (opt: ScalarListboxOption) => emit('update:modelValue', opt.id),
})
</script>

<template>
  <ScalarListbox
    v-model="selectedOption"
    :options="listboxOptions"
    resize>
    <button
      class="bg-b-1.5 hover:bg-b-2 py-1.25 flex w-full items-center gap-1 border-b px-2"
      type="button">
      <span class="text-c-2">Discriminator</span>
      <span class="composition-selector-label text-c-1 relative">
        {{ discriminatorPropertyName }} {{ selectedOption?.label }}
      </span>
      <ScalarIconCaretDown />
    </button>
  </ScalarListbox>
</template>
