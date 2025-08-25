<script setup lang="ts">
import {
  ScalarButton,
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { MediaTypeObject } from '@scalar/workspace-store/schemas/v3.1/strict/media-header-encoding'
import { computed } from 'vue'

const { examples = {} } = defineProps<{
  examples?: MediaTypeObject['examples']
}>()

const selectedExampleKey = defineModel<string>({
  required: true,
})

const exampleOptions = computed<ScalarListboxOption[]>(() =>
  Object.entries(examples).map(([key, example]) => ({
    id: key,
    label: example?.summary ?? key,
  })),
)

const selectedExample = computed<ScalarListboxOption | undefined>({
  get: () =>
    exampleOptions.value.find(({ id }) => id === selectedExampleKey.value),
  set: (v) => (selectedExampleKey.value = v?.id ?? ''),
})
</script>

<template>
  <ScalarListbox
    v-model="selectedExample"
    :options="exampleOptions"
    placement="bottom-start">
    <ScalarButton
      data-testid="example-picker"
      class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-1.5 py-0.75 text-base font-normal"
      fullWidth
      variant="ghost">
      <span>{{ selectedExample?.label ?? 'Select an example' }}</span>
      <ScalarIconCaretDown
        weight="bold"
        class="ui-open:rotate-180 mt-0.25 size-3 transition-transform duration-100" />
    </ScalarButton>
  </ScalarListbox>
</template>
