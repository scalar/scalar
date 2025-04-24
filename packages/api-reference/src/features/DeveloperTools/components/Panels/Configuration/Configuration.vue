<script setup lang="ts">
// import { ScalarCodeBlock } from '@scalar/components'
import { ScalarCheckbox, ScalarIcon, ScalarListbox } from '@scalar/components'
import { themeIds } from '@scalar/themes'
import type { ThemeId } from '@scalar/types'
import {
  apiReferenceConfigurationSchema,
  type AnyApiReferenceConfiguration,
} from '@scalar/types/api-reference'
import { computed } from 'vue'

const { configuration } = defineProps<{
  configuration?: Partial<AnyApiReferenceConfiguration>
}>()

const parsedConfiguration = computed(() =>
  apiReferenceConfigurationSchema.parse(configuration),
)

const emit = defineEmits<{
  (
    e: 'update:configuration',
    value: Partial<AnyApiReferenceConfiguration>,
  ): void
}>()

const updateConfiguration = (value: Partial<AnyApiReferenceConfiguration>) => {
  console.log('updateConfiguration', value)
  emit('update:configuration', value)
}

const booleanAttributes = [
  'showSidebar',
  'hideClientButton',
  'isEditable',
  'hideModels',
  'hideDownloadButton',
  'hideTestRequestButton',
  'hideSearch',
  'darkMode',
  'hideDarkModeToggle',
  'withDefaultFonts',
  'defaultOpenAllTags',
] as const

const themeOptions = computed(() =>
  themeIds.map((theme) => ({
    id: theme,
    label: theme,
    value: theme,
  })),
)

const selectedTheme = computed(() => {
  // TODO: Move all this to a component, make sure we’re always dealing with one configuration
  if (Array.isArray(parsedConfiguration.value)) {
    return {
      id: parsedConfiguration.value[0]?.theme || 'default',
      label: parsedConfiguration.value[0]?.theme || 'default',
      value: parsedConfiguration.value[0]?.theme || 'default',
    }
  }

  return {
    id: parsedConfiguration.value.theme || 'default',
    label: parsedConfiguration.value.theme || 'default',
    value: parsedConfiguration.value.theme || 'default',
  }
})
</script>

<template>
  <template v-if="configuration">
    <div>
      <template v-if="Array.isArray(configuration)">
        TODO: Multiple Configurations
        <!--  Move the stuff below into a component and render one or more of them -->
      </template>
      <template v-else>
        <div class="flex gap-2">
          <fieldset class="bg-b-2 w-1/3 rounded-md border p-3">
            <legend class="font-bold">Design</legend>

            <label class="mb-2 block">Layout</label>
            <div class="mb-4 flex gap-4">
              <div class="flex items-center gap-1">
                <input
                  type="radio"
                  name="layout"
                  id="layout-modern"
                  value="modern"
                  :checked="parsedConfiguration.layout === 'modern'"
                  @change="updateConfiguration({ layout: 'modern' })" />
                <label for="layout-modern">Modern</label>
              </div>
              <div class="flex items-center gap-1">
                <input
                  type="radio"
                  name="layout"
                  id="layout-classic"
                  value="classic"
                  :checked="parsedConfiguration.layout === 'classic'"
                  @change="updateConfiguration({ layout: 'classic' })" />
                <label for="layout-classic">Classic</label>
              </div>
            </div>

            <label class="mb-2 block">Theme</label>
            <div class="mb-4 flex gap-4">
              <ScalarListbox
                :options="themeOptions"
                :model-value="selectedTheme"
                @update:model-value="
                  (option) =>
                    updateConfiguration({ theme: option.value as ThemeId })
                ">
                <template #default>
                  <div
                    class="flex items-center justify-between gap-2 rounded border px-2 py-1.5">
                    <span>{{ selectedTheme.label }}</span>
                    <ScalarIcon
                      class="text-c-2"
                      icon="ChevronDown"
                      size="sm" />
                  </div>
                </template>
              </ScalarListbox>
            </div>

            <label class="mb-2 block">Force Dark Mode State</label>
            <div class="flex gap-4">
              <div class="flex gap-1">
                <input
                  type="radio"
                  name="forceDarkModeState"
                  id="forceDarkModeState-system"
                  :checked="!parsedConfiguration.forceDarkModeState"
                  @change="
                    updateConfiguration({ forceDarkModeState: undefined })
                  " />
                <label for="forceDarkModeState-system">System</label>
              </div>
              <div class="flex gap-1">
                <input
                  type="radio"
                  name="forceDarkModeState"
                  id="forceDarkModeState-light"
                  value="light"
                  :checked="parsedConfiguration.forceDarkModeState === 'light'"
                  @change="
                    updateConfiguration({ forceDarkModeState: 'light' })
                  " />
                <label for="forceDarkModeState-light">Light</label>
              </div>
              <div class="flex gap-1">
                <input
                  type="radio"
                  name="forceDarkModeState"
                  id="forceDarkModeState-dark"
                  value="dark"
                  :checked="parsedConfiguration.forceDarkModeState === 'dark'"
                  @change="
                    updateConfiguration({ forceDarkModeState: 'dark' })
                  " />
                <label for="forceDarkModeState-dark">Dark</label>
              </div>
            </div>
          </fieldset>

          <fieldset class="bg-b-2 w-1/3 rounded-md border p-3">
            <legend class="font-bold">Features</legend>
            <div
              v-for="attribute in booleanAttributes"
              :key="attribute">
              <div class="mb-1 flex items-center gap-1">
                <ScalarCheckbox
                  :modelValue="parsedConfiguration[attribute]"
                  @update:model-value="
                    (modelValue) =>
                      updateConfiguration({ [attribute]: modelValue })
                  " />
                <label :for="`checkbox-${attribute}`">{{ attribute }}</label>
              </div>
            </div>
          </fieldset>
        </div>
      </template>
    </div>
    <!-- <div>
      <ScalarCodeBlock
        class="max-w-10 border"
        :content="configuration"
        lang="json" />
    </div> -->
  </template>
</template>
