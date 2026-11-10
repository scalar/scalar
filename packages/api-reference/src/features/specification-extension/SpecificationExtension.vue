<script setup lang="ts">
import { SpecificationExtensions } from '@scalar/blocks/specification-extensions'
import { ScalarErrorBoundary } from '@scalar/components/error-boundary'
import { computed } from 'vue'

import { useSpecificationExtensions } from './use-specification-extensions'

const {
  value,
  selection,
  showExtensions = [],
  compact = false,
} = defineProps<{
  /** Reuse the selection that controls the surrounding metadata section. */
  selection?: ReturnType<typeof useSpecificationExtensions>
  /** Explicitly selected keys that may use the default renderer. */
  showExtensions?: string[]
  /** Use the surrounding panel spacing for default extension values. */
  compact?: boolean
  /**
   * Any value that can contain specification extensions.
   */
  value: Record<string, unknown> | undefined
}>()

const fallbackSelection = useSpecificationExtensions(
  () => value,
  () => showExtensions,
)
// The fallback computed values stay lazy when the parent supplies its selection.
const customExtensions = computed(
  () =>
    selection?.customExtensions.value ??
    fallbackSelection.customExtensions.value,
)
const defaultExtensions = computed(
  () =>
    selection?.defaultExtensions.value ??
    fallbackSelection.defaultExtensions.value,
)
</script>

<template>
  <SpecificationExtensions
    :compact="compact"
    :extensions="defaultExtensions" />
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
