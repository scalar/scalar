<script setup lang="ts">
import { ScalarCombobox } from '@scalar/components/combobox'
import { ScalarListbox } from '@scalar/components/listbox'
import { ScalarIconCaretDown } from '@scalar/icons'
import { useEventListener } from '@vueuse/core'
import { computed, ref } from 'vue'

import { useLocalization } from '@/features/localization'

const props = defineProps<{
  options: { label: string; id: string }[]
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
}>()

const { translate } = useLocalization()

// Returning focus from the search field can retain its focus-visible state after a click.
const isPointerInteraction = ref(false)
useEventListener('keydown', () => {
  isPointerInteraction.value = false
})

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
    class="document-selector px-3 pt-3"
    @pointerdown.capture="isPointerInteraction = true">
    <ScalarCombobox
      v-if="options.length > 5"
      :inputLabel="translate('search.inputLabel')"
      :modelValue="selected"
      :noResults="translate('search.noResults')"
      :options="formattedOptions"
      :placeholder="translate('search.placeholder')"
      resize
      @update:modelValue="(e) => e && emit('update:modelValue', e.id)">
      <template #default="{ open }">
        <button
          class="group/dropdown-label text-c-2 hover:text-c-1 flex w-full cursor-pointer items-center gap-1 rounded font-medium focus-visible:outline-offset-4"
          :class="{ 'outline-none': isPointerInteraction }"
          type="button">
          <span class="overflow-hidden text-base text-ellipsis">
            {{ selected?.label || 'Select API' }}
          </span>
          <ScalarIconCaretDown
            class="size-3 text-current transition-transform"
            :class="{ 'rotate-180': open }"
            weight="bold" />
        </button>
      </template>
      <template #option="{ option }">
        <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
      </template>
    </ScalarCombobox>
    <ScalarListbox
      v-else
      v-slot="{ open }"
      :modelValue="selected"
      :options="formattedOptions"
      resize
      @update:modelValue="(e) => emit('update:modelValue', e.id)">
      <button
        class="group/dropdown-label text-c-2 hover:text-c-1 flex w-full cursor-pointer items-center gap-1 rounded font-medium focus-visible:outline-offset-4"
        :class="{ 'outline-none': isPointerInteraction }"
        type="button">
        <span class="overflow-hidden text-base text-ellipsis">
          {{ selected?.label || 'Select API' }}
        </span>
        <ScalarIconCaretDown
          class="size-3 text-current transition-transform"
          :class="{ 'rotate-180': open }"
          weight="bold" />
      </button>
    </ScalarListbox>
  </div>
</template>
