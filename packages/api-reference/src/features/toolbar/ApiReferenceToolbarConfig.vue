<script lang="ts" setup>
import {
  ScalarCodeBlock,
  ScalarFormField,
  ScalarFormSection,
} from '@scalar/components'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { type ThemeId } from '@scalar/themes'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed } from 'vue'

import ApiReferenceToolbarConfigLayout from '@/features/toolbar/ApiReferenceToolbarConfigLayout.vue'
import ApiReferenceToolbarConfigTheme from '@/features/toolbar/ApiReferenceToolbarConfigTheme.vue'
import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'

const { configuration } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')

const snippet = computed<string>(() => {
  return prettyPrintJson({
    ...overrides.value, // Make sure the overrides are first
    ...configuration,
    ...overrides.value, // But also that they override the configuration
  })
})

const theme = computed<ThemeId>({
  get: () => overrides.value?.theme ?? configuration?.theme ?? 'default',
  set: (theme) => (overrides.value = { ...overrides.value, theme }),
})

const layout = computed<'modern' | 'classic'>({
  get: () => overrides.value?.layout ?? configuration?.layout ?? 'modern',
  set: (layout) => (overrides.value = { ...overrides.value, layout }),
})
</script>
<template>
  <ApiReferenceToolbarPopover>
    <template #label> Configure </template>
    <ScalarFormSection>
      <template #label>Scalar Configuration</template>
      <ScalarCodeBlock
        class="bg-b-1.5 max-h-40 rounded border text-sm"
        :content="snippet"
        lang="json" />
    </ScalarFormSection>
    <div class="flex flex-col gap-4">
      <ScalarFormField>
        <template #label>Theme</template>
        <ApiReferenceToolbarConfigTheme v-model="theme" />
      </ScalarFormField>
      <ScalarFormField>
        <template #label>Layout</template>
        <ApiReferenceToolbarConfigLayout v-model="layout" />
      </ScalarFormField>
    </div>
  </ApiReferenceToolbarPopover>
</template>
