<script setup lang="ts">
import { ScalarCodeBlock } from '@scalar/components'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'

defineProps<{
  configuration?: Partial<AnyApiReferenceConfiguration>
}>()

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
</script>

<template>
  <h2 class="mb-3">Configuration</h2>
  <template v-if="configuration">
    <div>
      <template v-if="Array.isArray(configuration)">
        TODO: Multiple Configurations
      </template>
      <template v-else>
        <div>Layout</div>
        <input
          type="radio"
          name="layout"
          value="modern"
          :checked="!configuration.layout || configuration.layout === 'modern'"
          @change="updateConfiguration({ layout: 'modern' })" />
        <label for="modern">Modern</label>
        <input
          type="radio"
          name="layout"
          value="classic"
          :checked="configuration.layout === 'classic'"
          @change="updateConfiguration({ layout: 'classic' })" />
        <label for="classic">Classic</label>

        <div>forceDarkModeState</div>
        <input
          type="radio"
          name="forceDarkModeState"
          :checked="!configuration.forceDarkModeState"
          @change="updateConfiguration({ forceDarkModeState: undefined })" />
        <label for="disabled">System</label>
        <input
          type="radio"
          name="forceDarkModeState"
          value="light"
          :checked="configuration.forceDarkModeState === 'light'"
          @change="updateConfiguration({ forceDarkModeState: 'light' })" />
        <label for="light">Light</label>
        <input
          type="radio"
          name="forceDarkModeState"
          value="dark"
          :checked="configuration.forceDarkModeState === 'dark'"
          @change="updateConfiguration({ forceDarkModeState: 'dark' })" />
        <label for="dark">Dark</label>
      </template>
    </div>
    <div>
      <ScalarCodeBlock
        class="max-w-10 border"
        :content="configuration"
        lang="json" />
    </div>
  </template>
</template>
