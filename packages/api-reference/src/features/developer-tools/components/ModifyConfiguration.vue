<script lang="ts" setup>
import { ScalarCodeBlock } from '@scalar/components/code-block'
import {
  ScalarFormField,
  ScalarFormInput,
  ScalarFormSection,
} from '@scalar/components/form'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { type ThemeId } from '@scalar/themes'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

import ApiReferenceToolbarConfigLayout from './ApiReferenceToolbarConfigLayout.vue'
import ApiReferenceToolbarConfigLayoutOptions from './ApiReferenceToolbarConfigLayoutOptions.vue'
import ApiReferenceToolbarConfigTheme from './ApiReferenceToolbarConfigTheme.vue'
import ApiReferenceToolbarPopover from './ApiReferenceToolbarPopover.vue'

const { configuration } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')
const { translate } = useLocalization()

const snippet = computed<string>(() => {
  return prettyPrintJson({
    ...overrides.value, // Make sure the overrides are first
    ...configuration,
    ...overrides.value, // But also that they override the configuration
  })
})

const theme = computed<ThemeId>({
  get: () => overrides.value?.theme ?? configuration?.theme ?? 'default',
  set: (t) => (overrides.value = { ...overrides.value, theme: t }),
})

const layout = computed<'modern' | 'classic'>({
  get: () => overrides.value?.layout ?? configuration?.layout ?? 'modern',
  set: (l) => (overrides.value = { ...overrides.value, layout: l }),
})

const schemaPropertyOrder = computed<
  ApiReferenceConfiguration['orderSchemaPropertiesBy']
>({
  get: () =>
    overrides.value?.orderSchemaPropertiesBy ??
    configuration?.orderSchemaPropertiesBy ??
    'alpha',
  set: (orderSchemaPropertiesBy) =>
    (overrides.value = { ...overrides.value, orderSchemaPropertiesBy }),
})
</script>
<template>
  <ApiReferenceToolbarPopover class="w-120">
    <template #label>{{ translate('developerTools.configure') }}</template>
    <ScalarFormSection>
      <template #label>
        {{ translate('developerTools.scalarConfiguration') }}
      </template>
      <ScalarCodeBlock
        class="bg-b-1.5 flex max-h-40 flex-col rounded border text-sm"
        :content="snippet"
        lang="json" />
    </ScalarFormSection>
    <div class="flex flex-col gap-4">
      <ScalarFormField>
        <template #label>{{ translate('developerTools.theme') }}</template>
        <ApiReferenceToolbarConfigTheme v-model="theme" />
      </ScalarFormField>
      <ScalarFormField>
        <template #label>{{ translate('developerTools.layout') }}</template>
        <ApiReferenceToolbarConfigLayout v-model="layout" />
      </ScalarFormField>
      <ScalarFormField>
        <template #label>
          {{ translate('developerTools.orderSchemaPropertiesBy') }}
        </template>
        <ScalarFormInput is="div">
          <select
            v-model="schemaPropertyOrder"
            :aria-label="translate('developerTools.orderSchemaPropertiesBy')"
            class="text-c-1 w-full cursor-pointer border-0 bg-transparent p-0 outline-offset-4">
            <option value="alpha">
              {{ translate('developerTools.alphabeticalOrder') }}
            </option>
            <option value="preserve">
              {{ translate('developerTools.documentOrder') }}
            </option>
          </select>
        </ScalarFormInput>
      </ScalarFormField>
      <ScalarFormField is="div">
        <template #label>
          {{ translate('developerTools.layoutOptions') }}
        </template>
        <ApiReferenceToolbarConfigLayoutOptions
          v-model="overrides"
          :configuration />
      </ScalarFormField>
    </div>
  </ApiReferenceToolbarPopover>
</template>
