<script setup lang="ts">
import { ScalarFormInputGroup } from '@scalar/components/form'
import { ScalarToggleInput } from '@scalar/components/toggle'
import {
  DEFAULT_MODELS_SECTION_LABEL,
  type ApiReferenceConfiguration,
} from '@scalar/types/api-reference'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

type LayoutOptions = {
  expandAllParameters?: boolean
  expandAllSchemaProperties?: boolean
  hideModelNames?: boolean
  orderRequiredPropertiesFirst?: boolean
  showSidebar?: boolean
  defaultOpenFirstTag?: boolean
  defaultOpenAllTags?: boolean
  expandAllModelSections?: boolean
  expandAllResponses?: boolean
  hideClientButton?: boolean
  hideDarkModeToggle?: boolean
  hideModels?: boolean
  hideSearch?: boolean
  hideTestRequestButton?: boolean
  showOperationId?: boolean
}

const { configuration } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const model = defineModel<LayoutOptions>({
  default: () => ({}),
})
const { translate } = useLocalization()

const getValue = (key: keyof LayoutOptions, defaultValue = false): boolean =>
  model.value[key] ?? configuration?.[key] ?? defaultValue

const setValue = (key: keyof LayoutOptions, value: boolean): void => {
  // Explicit selections must override supplied configuration, including library defaults.
  model.value = { ...model.value, [key]: value }
}

const modelsSectionLabel = computed(
  () => configuration?.modelsSectionLabel ?? DEFAULT_MODELS_SECTION_LABEL,
)

const expandAllModelsLabel = computed(() =>
  translate('developerTools.expandAll', { label: modelsSectionLabel.value }),
)

const hideModelsLabel = computed(() =>
  translate('developerTools.hideModels', { label: modelsSectionLabel.value }),
)
</script>
<template>
  <ScalarFormInputGroup>
    <ScalarToggleInput
      :modelValue="getValue('showSidebar', true)"
      @update:modelValue="(v) => setValue('showSidebar', !!v)">
      {{ translate('developerTools.showSidebar') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('defaultOpenFirstTag', true)"
      @update:modelValue="(v) => setValue('defaultOpenFirstTag', !!v)">
      {{ translate('developerTools.defaultOpenFirstTag') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('defaultOpenAllTags')"
      @update:modelValue="(v) => setValue('defaultOpenAllTags', !!v)">
      {{ translate('developerTools.defaultOpenAllTags') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('expandAllModelSections')"
      @update:modelValue="(v) => setValue('expandAllModelSections', !!v)">
      {{ expandAllModelsLabel }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('expandAllParameters', true)"
      @update:modelValue="(v) => setValue('expandAllParameters', !!v)">
      {{ translate('developerTools.expandAllParameters') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('expandAllSchemaProperties')"
      @update:modelValue="(v) => setValue('expandAllSchemaProperties', !!v)">
      {{ translate('developerTools.expandAllSchemaProperties') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('expandAllResponses')"
      @update:modelValue="(v) => setValue('expandAllResponses', !!v)">
      {{ translate('developerTools.expandAllResponses') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('hideClientButton')"
      @update:modelValue="(v) => setValue('hideClientButton', !!v)">
      {{ translate('developerTools.hideClientButton') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('hideDarkModeToggle')"
      @update:modelValue="(v) => setValue('hideDarkModeToggle', !!v)">
      {{ translate('developerTools.hideDarkModeToggle') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('hideModels')"
      @update:modelValue="(v) => setValue('hideModels', !!v)">
      {{ hideModelsLabel }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('hideModelNames')"
      @update:modelValue="(v) => setValue('hideModelNames', !!v)">
      {{ translate('developerTools.hideModelNames') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('hideSearch')"
      @update:modelValue="(v) => setValue('hideSearch', !!v)">
      {{ translate('developerTools.hideSearch') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('showOperationId')"
      @update:modelValue="(v) => setValue('showOperationId', !!v)">
      {{ translate('developerTools.showOperationId') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('hideTestRequestButton')"
      @update:modelValue="(v) => setValue('hideTestRequestButton', !!v)">
      {{ translate('developerTools.hideTestRequestButton') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('orderRequiredPropertiesFirst', true)"
      @update:modelValue="(v) => setValue('orderRequiredPropertiesFirst', !!v)">
      {{ translate('developerTools.orderRequiredPropertiesFirst') }}
    </ScalarToggleInput>
  </ScalarFormInputGroup>
</template>
