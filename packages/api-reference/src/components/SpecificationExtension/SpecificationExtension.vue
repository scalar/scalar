<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import { computed } from 'vue'

import { usePluginManager } from '@/plugins'

const { value } = defineProps<{
  /**
   * Any value that can contain OpenAPI specification extensions.
   */
  value: Record<string, unknown> | undefined
}>()

const { getSpecificationExtensions } = usePluginManager()

/**
 * Extract registered OpenAPI extension names
 */
function getCustomExtensionNames(
  value: Record<string, any> | undefined,
): `x-${string}`[] {
  return Object.keys(value ?? {}).filter((item) =>
    item.startsWith('x-'),
  ) as `x-${string}`[]
}

/**
 * Get the components for the specification extensions
 */
function getCustomOpenApiExtensionComponents(extensionNames: `x-${string}`[]) {
  return extensionNames
    .flatMap((name) => getSpecificationExtensions(name))
    .filter((extension) => extension.component)
}

/**
 * Get the names of custom extensions from the provided value.
 */
const customExtensionNames = computed(() => getCustomExtensionNames(value))

/**
 * Get the components for the custom extensions.
 */
const customExtensions = computed(() =>
  getCustomOpenApiExtensionComponents(customExtensionNames.value),
)
</script>

<template>
  <template v-if="typeof value === 'object' && customExtensions.length">
    <div class="text-base">
      <template v-for="extension in customExtensions">
        <ScalarErrorBoundary>
          <component
            :is="extension.component"
            v-bind="{ [extension.name]: value?.[extension.name] }" />
        </ScalarErrorBoundary>
      </template>
    </div>
  </template>
</template>
