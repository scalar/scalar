<script setup lang="ts">
import { ScalarFormInputGroup } from '@scalar/components/form'
import { ScalarToggleInput } from '@scalar/components/toggle'
import {
  DEFAULT_MODELS_SECTION_LABEL,
  type ApiReferenceConfiguration,
} from '@scalar/types/api-reference'
import { computed } from 'vue'

import { useApiReferenceLocalization } from '@/features/localization'

type LayoutOptions = {
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
  default: {},
})
const { translate } = useApiReferenceLocalization()

function getValue(key: keyof LayoutOptions, defaultValue: boolean = false) {
  return model.value[key] ?? configuration?.[key] ?? defaultValue
}

function setValue(
  key: keyof LayoutOptions,
  value: boolean,
  defaultValue: boolean = false,
) {
  if (value !== defaultValue) {
    model.value = { ...model.value, [key]: value }
  } else {
    model.value = Object.fromEntries(
      Object.entries(model.value).filter(([k]) => key !== k),
    )
  }
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
      @update:modelValue="(v) => setValue('showSidebar', !!v, true)">
      {{ translate('developerTools.showSidebar') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('defaultOpenFirstTag', true)"
      @update:modelValue="(v) => setValue('defaultOpenFirstTag', !!v, true)">
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
  </ScalarFormInputGroup>
</template>
