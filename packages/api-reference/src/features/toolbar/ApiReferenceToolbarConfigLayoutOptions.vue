<script setup lang="ts">
import { ScalarFormInputGroup, ScalarToggleInput } from '@scalar/components'
import type { ApiReferenceConfiguration } from '@scalar/types'

type LayoutOptions = {
  showSidebar?: boolean
  defaultOpenAllTags?: boolean
  expandAllModelSections?: boolean
  expandAllResponses?: boolean
  hideClientButton?: boolean
  hideDarkModeToggle?: boolean
  hideModels?: boolean
  hideSearch?: boolean
  hideTestRequestButton?: boolean
}

const { configuration = {} } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const model = defineModel<LayoutOptions>({
  default: {},
})

function getValue(key: keyof LayoutOptions, defaultValue: boolean = false) {
  return model.value[key] ?? configuration?.[key] ?? defaultValue
}

function setValue(key: keyof LayoutOptions, value: boolean) {
  // Apply the value making sure it's bumped to the top of the list
  model.value = { [key]: value, ...model.value, [key]: value }
}
</script>
<template>
  <ScalarFormInputGroup>
    <ScalarToggleInput
      :modelValue="getValue('showSidebar', true)"
      @update:modelValue="(v) => setValue('showSidebar', !!v)">
      Show Sidebar
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('defaultOpenAllTags')"
      @update:modelValue="(v) => setValue('defaultOpenAllTags', !!v)">
      Default Open All Tags
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('expandAllModelSections')"
      @update:modelValue="(v) => setValue('expandAllModelSections', !!v)">
      Expand All Model Sections
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('expandAllResponses')"
      @update:modelValue="(v) => setValue('expandAllResponses', !!v)">
      Expand All Responses
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('hideClientButton')"
      @update:modelValue="(v) => setValue('hideClientButton', !!v)">
      Hide Client Button
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('hideDarkModeToggle')"
      @update:modelValue="(v) => setValue('hideDarkModeToggle', !!v)">
      Hide Dark Mode Toggle
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('hideModels')"
      @update:modelValue="(v) => setValue('hideModels', !!v)">
      Hide Models
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('hideSearch')"
      @update:modelValue="(v) => setValue('hideSearch', !!v)">
      Hide Search
    </ScalarToggleInput>
    <ScalarToggleInput
      :modelValue="getValue('hideTestRequestButton')"
      @update:modelValue="(v) => setValue('hideTestRequestButton', !!v)">
      Hide Test Request Button
    </ScalarToggleInput>
  </ScalarFormInputGroup>
</template>
