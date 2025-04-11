<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'

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
const customExtensionNames = getCustomExtensionNames(value)

/**
 * Get the components for the custom extensions.
 */
const customExtensions =
  getCustomOpenApiExtensionComponents(customExtensionNames)
</script>

<template>
  <template v-if="typeof value === 'object'">
    <template v-for="extension in customExtensions">
      <ScalarErrorBoundary>
        <div class="text-base">
          <component
            :is="extension.component"
            v-bind="{ [extension.name]: value?.[extension.name] }" />
        </div>
      </ScalarErrorBoundary>
    </template>
  </template>
</template>
