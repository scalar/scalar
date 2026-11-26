<script lang="ts" setup>
/**
 * The configuration controls behind "Configure": the generated JSON, theme, layout and layout
 * options. The toolbar popover and the localhost shell's side panel both render it.
 */
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
import ApiReferenceToolbarSelect from './ApiReferenceToolbarSelect.vue'

const { configuration, flat = false } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
  /**
   * The localhost shell's side panel: dropdowns for the layout and the property order, and flat
   * layout options. The toolbar dropdown keeps its radio list and boxed options.
   */
  flat?: boolean
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

/** The side panel picks the layout and the property order from matching dropdowns */
const layoutOptions = computed(() => [
  { value: 'modern' as const, label: translate('developerTools.layoutModern') },
  {
    value: 'classic' as const,
    label: translate('developerTools.layoutClassic'),
  },
])
const schemaPropertyOrderOptions = computed(() => [
  {
    value: 'alpha' as const,
    label: translate('developerTools.alphabeticalOrder'),
  },
  {
    value: 'preserve' as const,
    label: translate('developerTools.documentOrder'),
  },
])

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
      <ApiReferenceToolbarConfigTheme
        v-model="theme"
        :flat />
    </ScalarFormField>
    <ScalarFormField>
      <template #label>{{ translate('developerTools.layout') }}</template>
      <ApiReferenceToolbarSelect
        v-if="flat"
        v-model="layout"
        :label="translate('developerTools.layout')"
        :options="layoutOptions" />
      <ApiReferenceToolbarConfigLayout
        v-else
        v-model="layout" />
    </ScalarFormField>
    <ScalarFormField>
      <template #label>
        {{ translate('developerTools.orderSchemaPropertiesBy') }}
      </template>
      <ApiReferenceToolbarSelect
        v-if="flat"
        v-model="schemaPropertyOrder"
        :label="translate('developerTools.orderSchemaPropertiesBy')"
        :options="schemaPropertyOrderOptions" />
      <ScalarFormInput
        is="div"
        v-else>
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
        :configuration
        :flat />
    </ScalarFormField>
  </div>
</template>
