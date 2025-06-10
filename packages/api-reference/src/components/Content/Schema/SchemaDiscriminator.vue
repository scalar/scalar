<script lang="ts" setup>
import { ScalarListbox, type ScalarListboxOption } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import { computed, ref } from 'vue'

import type { DiscriminatorMapping } from '@/hooks/useDiscriminator'

const { discriminatorMapping, discriminator } = defineProps<{
  discriminatorMapping: DiscriminatorMapping
  discriminator: string
}>()

const selectedDiscriminator = ref<string>('')

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Handle discriminator type change
const handleDiscriminatorChange = (type: string) => {
  selectedDiscriminator.value = type
  emit('update:modelValue', type)
}

const discriminatorListboxOptions = computed(() => {
  if (!discriminatorMapping) {
    return []
  }

  return Object.keys(discriminatorMapping).map((type) => ({
    id: type,
    label: type,
  }))
})

const selectedDiscriminatorOption = computed({
  get: () =>
    discriminatorListboxOptions.value.find(
      (opt: ScalarListboxOption) => opt.id === discriminator,
    ),
  set: (opt: ScalarListboxOption) => {
    if (opt?.id) {
      handleDiscriminatorChange(opt.id)
    }
  },
})
</script>

<template>
  <ScalarListbox
    v-model="selectedDiscriminatorOption"
    :options="discriminatorListboxOptions"
    resize>
    <button
      class="bg-b-1.5 hover:bg-b-2 mt-2 flex w-full items-center gap-1 rounded border px-2 py-1.25"
      type="button">
      <span class="composition-selector-label text-c-1 relative">
        {{ selectedDiscriminatorOption?.label || 'Schema' }}
      </span>
      <ScalarIconCaretDown class="z-1" />
    </button>
  </ScalarListbox>
</template>
