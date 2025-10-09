<script lang="ts" setup>
import { ScalarFormField, ScalarFormSection } from '@scalar/components'
import { type ThemeId } from '@scalar/themes'
import {
  apiReferenceConfigurationSchema,
  type ApiReferenceConfiguration,
} from '@scalar/types'
import { computed, onMounted, ref, watch } from 'vue'

import ApiReferenceToolbarConfigEditor from '@/features/toolbar/ApiReferenceToolbarConfigEditor.vue'
import ApiReferenceToolbarConfigLayout from '@/features/toolbar/ApiReferenceToolbarConfigLayout.vue'
import ApiReferenceToolbarConfigLayoutOptions from '@/features/toolbar/ApiReferenceToolbarConfigLayoutOptions.vue'
import ApiReferenceToolbarConfigTheme from '@/features/toolbar/ApiReferenceToolbarConfigTheme.vue'
import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'

const { configuration } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')

const temp = ref<Partial<ApiReferenceConfiguration>>()

/** The default configuration values from the schema */
const defaults: ApiReferenceConfiguration =
  apiReferenceConfigurationSchema.parse({})

const configKey = apiReferenceConfigurationSchema.keyof()

/** Typeguard to check if a key is a config key */
function isConfigKey(key: string): key is keyof ApiReferenceConfiguration {
  return configKey.safeParse(key).success
}

onMounted(() => {
  const config = { ...configuration }

  Object.keys(config).forEach((key) => {
    if (!isConfigKey(key)) {
      return
    }
    // Otherwise if it's the same as the default remove it
    if (config[key] === defaults[key]) {
      delete config[key]
    }
  })
  temp.value = config
})

watch(overrides, (config) => {
  if (JSON.stringify(config) !== JSON.stringify(temp.value)) {
    temp.value = config
  }
})

watch(temp, (config) => {
  if (JSON.stringify(config) !== JSON.stringify(overrides.value)) {
    overrides.value = config
  }
})

const theme = computed<ThemeId>({
  get: () => configuration?.theme ?? 'default',
  set: (theme) =>
    (overrides.value = { ...{ theme: undefined }, ...overrides.value, theme }),
})

const layout = computed<'modern' | 'classic'>({
  get: () => configuration?.layout ?? 'modern',
  set: (layout) =>
    (overrides.value = {
      ...{ layout: undefined },
      ...overrides.value,
      layout,
    }),
})
</script>
<template>
  <ApiReferenceToolbarPopover class="w-160">
    <template #label>Configure</template>
    <ScalarFormSection>
      <template #label>Scalar Configuration</template>
      <ApiReferenceToolbarConfigEditor v-model="temp" />
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
