<script lang="ts" setup>
import { ScalarCodeBlock, ScalarFormSection } from '@scalar/components'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { type ThemeId } from '@scalar/themes'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed } from 'vue'

import ApiReferenceToolbarConfigTheme from '@/features/toolbar/ApiReferenceToolbarConfigTheme.vue'
import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'

const { configuration } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')

const snippet = computed<string>(() => {
  return prettyPrintJson({ ...configuration, ...overrides.value })
})

const theme = computed<ThemeId>({
  get: () => overrides.value?.theme ?? configuration?.theme ?? 'default',
  set: (theme) => (overrides.value = { ...overrides.value, theme }),
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
    <ScalarFormSection>
      <template #label>Theme</template>
      <ApiReferenceToolbarConfigTheme v-model="theme" />
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
