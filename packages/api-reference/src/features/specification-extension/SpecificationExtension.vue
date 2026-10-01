<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components/error-boundary'
import { computed } from 'vue'

import { usePluginManager } from '@/plugins'

import ExtensionValue from './ExtensionValue.vue'

const { value, showExtensions = [] } = defineProps<{
  /** Explicitly selected keys that may use the default renderer. */
  showExtensions?: string[]
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
  source: Record<string, unknown> | undefined,
): `x-${string}`[] {
  return Object.keys(source ?? {}).filter((item): item is `x-${string}` =>
    item.startsWith('x-'),
  )
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
/** Custom plugin components retain ownership of their extension keys. */
const defaultExtensions = computed(() =>
  [...new Set(showExtensions)].filter(
    (name) =>
      name.startsWith('x-') &&
      Object.hasOwn(value ?? {}, name) &&
      !customExtensions.value.some((extension) => extension.name === name),
  ),
)
</script>

<template>
  <dl
    v-if="defaultExtensions.length"
    class="my-3 grid gap-3 text-base">
    <div
      v-for="name in defaultExtensions"
      :key="name"
      class="min-w-0">
      <dt class="font-code font-medium break-words">{{ name }}</dt>
      <dd class="text-c-2 mt-1">
        <ExtensionValue :value="value?.[name]" />
      </dd>
    </div>
  </dl>
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
