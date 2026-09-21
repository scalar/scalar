<script setup lang="ts">
import { ScalarCombobox } from '@scalar/components/combobox'
import { ScalarIconCaretDown } from '@scalar/icons'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

const props = defineProps<{
  options: { label: string; id: string }[]
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
}>()

const { translate } = useLocalization()

const formattedOptions = computed(() =>
  props.options.map((o) => ({ id: o.id, label: o.label })),
)

const selected = computed(() =>
  formattedOptions.value.find((o) => o.id === props.modelValue),
)
</script>

<template>
  <div
    v-if="options.length > 1"
    class="document-selector px-3 pt-3">
    <ScalarCombobox
      v-slot="{ open }"
      :inputLabel="translate('search.inputLabel')"
      :modelValue="selected"
      :noResults="translate('search.noResults')"
      :options="formattedOptions"
      :placeholder="translate('search.placeholder')"
      resize
      @update:modelValue="(e) => e && emit('update:modelValue', e.id)">
      <button
        class="group/dropdown-label text-c-2 hover:text-c-1 flex w-full cursor-pointer items-center gap-1 font-medium"
        type="button">
        <span class="overflow-hidden text-base text-ellipsis">
          {{ selected?.label || 'Select API' }}
        </span>
        <ScalarIconCaretDown
          class="size-3 text-current transition-transform"
          :class="{ 'rotate-180': open }"
          weight="bold" />
      </button>
    </ScalarCombobox>
  </div>
</template>
