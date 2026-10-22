<script setup lang="ts">
import { SpecificationExtensions } from '@scalar/blocks/specification-extensions'
import { ScalarErrorBoundary } from '@scalar/components/error-boundary'

import { useSpecificationExtensions } from './use-specification-extensions'

const { value, showExtensions = [] } = defineProps<{
  /** Explicitly selected keys that may use the default renderer. */
  showExtensions?: string[]
  /**
   * Any value that can contain specification extensions.
   */
  value: Record<string, unknown> | undefined
}>()

const { customExtensions, defaultExtensions } = useSpecificationExtensions(
  () => value,
  () => showExtensions,
)
</script>

<template>
  <SpecificationExtensions :extensions="defaultExtensions" />
  <template v-if="typeof value === 'object' && customExtensions.length">
    <div class="text-base">
      <template
        v-for="(extension, index) in customExtensions"
        :key="index">
        <ScalarErrorBoundary>
          <template v-if="extension.renderer">
            <!-- Custom rendering -->
            <component
              :is="extension.renderer"
              v-bind="{
                [extension.name]: value?.[extension.name],
                component: extension.component,
              }" />
          </template>
          <template v-else>
            <!-- Vue rendering -->
            <component
              :is="extension.component"
              v-bind="{ [extension.name]: value?.[extension.name] }" />
          </template>
        </ScalarErrorBoundary>
      </template>
    </div>
  </template>
</template>
