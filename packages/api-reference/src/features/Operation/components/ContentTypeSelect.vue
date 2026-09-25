<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarListbox } from '@scalar/components/listbox'
import { ScalarIconCaretDown } from '@scalar/icons'
import { cva } from '@scalar/use-hooks/useBindCx'
import type { MediaTypeObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

import ScreenReader from '@/components/ScreenReader.vue'
import { useLocalization } from '@/features/localization'

const { content } = defineProps<{
  content: Record<string, MediaTypeObject> | undefined
}>()
const { translate } = useLocalization()

/** The selected content type with two-way binding */
const selectedContentType = defineModel<string>({ required: true })

defineOptions({ inheritAttrs: false })

const contentTypes = computed(() => Object.keys(content ?? {}))

const selectedOption = computed({
  get: () =>
    options.value.find((option) => option.id === selectedContentType.value),
  set: (option) => {
    if (option) {
      selectedContentType.value = option.id
    }
  },
})

const options = computed(() => {
  return contentTypes.value.map((type) => ({
    id: type,
    label: type,
  }))
})

// Content type select style variant based on dropdown availability
const contentTypeSelect = cva({
  base: 'font-normal text-c-2 bg-b-1 py-1 flex items-center gap-1 rounded-full text-xs leading-none border',
  variants: {
    dropdown: {
      true: 'hover:text-c-1 pl-2 pr-1.5 font-medium cursor-pointer',
      false: 'px-2',
    },
  },
})
</script>
<template>
  <ScalarListbox
    v-if="contentTypes.length > 1"
    v-slot="{ open }"
    v-model="selectedOption"
    :options="options"
    placement="bottom-end"
    teleport
    @click.stop>
    <ScalarButton
      class="h-fit"
      :class="contentTypeSelect({ dropdown: true })"
      variant="ghost"
      v-bind="$attrs"
      @click.stop>
      <ScreenReader>
        {{ translate('operation.selectedContentType') }}:
      </ScreenReader>
      <span>{{ selectedContentType }}</span>
      <ScalarIconCaretDown
        class="size-2.75 transition-transform duration-100"
        :class="{ 'rotate-180': open }"
        weight="bold" />
    </ScalarButton>
  </ScalarListbox>
  <!-- With a single content type there is nothing to choose, so this read-only
       readout stays out of the tab order: a focus stop on static text strands
       keyboard users on something they cannot act on. It keeps a role and the
       same name as the dropdown branch so screen readers still announce it. -->
  <div
    v-else
    :aria-label="translate('operation.selectedContentType')"
    class="selected-content-type"
    :class="contentTypeSelect({ dropdown: false })"
    role="group"
    v-bind="$attrs">
    <span>{{ selectedContentType }}</span>
  </div>
</template>
