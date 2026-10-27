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

const { configuration, flat = false } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
  /**
   * Plain rows split by dividers, with no box, background or side padding, for the localhost
   * shell's side panel. The dropdown keeps the boxed group.
   */
  flat?: boolean
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

/** Only set when flat, so the dropdown renders the same classes as before */
const groupClass = computed<string | undefined>(() =>
  flat ? 'rounded-none border-0' : undefined,
)
/** Flat rows keep their label at full contrast whether the option is on or off */
const rowClass = computed<string | undefined>(() =>
  flat ? 'text-c-1 bg-transparent px-0 hover:bg-transparent' : undefined,
)

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
  <ScalarFormInputGroup :class="groupClass">
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('showSidebar', true)"
      @update:modelValue="(v) => setValue('showSidebar', !!v)">
      {{ translate('developerTools.showSidebar') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('defaultOpenFirstTag', true)"
      @update:modelValue="(v) => setValue('defaultOpenFirstTag', !!v)">
      {{ translate('developerTools.defaultOpenFirstTag') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('defaultOpenAllTags')"
      @update:modelValue="(v) => setValue('defaultOpenAllTags', !!v)">
      {{ translate('developerTools.defaultOpenAllTags') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('expandAllModelSections')"
      @update:modelValue="(v) => setValue('expandAllModelSections', !!v)">
      {{ expandAllModelsLabel }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('expandAllParameters', true)"
      @update:modelValue="(v) => setValue('expandAllParameters', !!v)">
      {{ translate('developerTools.expandAllParameters') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('expandAllSchemaProperties')"
      @update:modelValue="(v) => setValue('expandAllSchemaProperties', !!v)">
      {{ translate('developerTools.expandAllSchemaProperties') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('expandAllResponses')"
      @update:modelValue="(v) => setValue('expandAllResponses', !!v)">
      {{ translate('developerTools.expandAllResponses') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('hideClientButton')"
      @update:modelValue="(v) => setValue('hideClientButton', !!v)">
      {{ translate('developerTools.hideClientButton') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('hideDarkModeToggle')"
      @update:modelValue="(v) => setValue('hideDarkModeToggle', !!v)">
      {{ translate('developerTools.hideDarkModeToggle') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('hideModels')"
      @update:modelValue="(v) => setValue('hideModels', !!v)">
      {{ hideModelsLabel }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('hideModelNames')"
      @update:modelValue="(v) => setValue('hideModelNames', !!v)">
      {{ translate('developerTools.hideModelNames') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('hideSearch')"
      @update:modelValue="(v) => setValue('hideSearch', !!v)">
      {{ translate('developerTools.hideSearch') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('showOperationId')"
      @update:modelValue="(v) => setValue('showOperationId', !!v)">
      {{ translate('developerTools.showOperationId') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('hideTestRequestButton')"
      @update:modelValue="(v) => setValue('hideTestRequestButton', !!v)">
      {{ translate('developerTools.hideTestRequestButton') }}
    </ScalarToggleInput>
    <ScalarToggleInput
      :class="rowClass"
      :modelValue="getValue('orderRequiredPropertiesFirst', true)"
      @update:modelValue="(v) => setValue('orderRequiredPropertiesFirst', !!v)">
      {{ translate('developerTools.orderRequiredPropertiesFirst') }}
    </ScalarToggleInput>
  </ScalarFormInputGroup>
</template>
