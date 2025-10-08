<script lang="ts" setup>
import { ScalarFormField, ScalarFormSection } from '@scalar/components'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { type ThemeId } from '@scalar/themes'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed, ref, watch } from 'vue'

import ApiReferenceToolbarConfigEditor from '@/features/toolbar/ApiReferenceToolbarConfigEditor.vue'
import ApiReferenceToolbarConfigLayout from '@/features/toolbar/ApiReferenceToolbarConfigLayout.vue'
import ApiReferenceToolbarConfigLayoutOptions from '@/features/toolbar/ApiReferenceToolbarConfigLayoutOptions.vue'
import ApiReferenceToolbarConfigTheme from '@/features/toolbar/ApiReferenceToolbarConfigTheme.vue'
import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'

const { configuration } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')

const tempConfig = ref<string>(
  prettyPrintJson({
    ...overrides.value, // Make sure the overrides are first
    ...configuration,
    ...overrides.value, // But also that they override the configuration
  }),
)

watch(tempConfig, (newValue) => {
  try {
    overrides.value = JSON.parse(newValue || '{}')
  } catch (e) {
    // Invalid JSON, do not update overrides
    return
  }
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
  <ApiReferenceToolbarPopover class="w-160">
    <template #label>Configure</template>
    <ScalarFormSection>
      <template #label>Scalar Configuration</template>
      <ApiReferenceToolbarConfigEditor v-model="tempConfig" />
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
      <ScalarFormField is="div">
        <template #label>Layout Options</template>
        <ApiReferenceToolbarConfigLayoutOptions
          :configuration
          v-model="overrides" />
      </ScalarFormField>
    </div>
  </ApiReferenceToolbarPopover>
</template>
