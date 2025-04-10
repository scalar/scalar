<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'

import { usePluginManager } from '@/plugins'

defineProps<{
  value: Record<string, unknown> | undefined
}>()

const { getOpenApiExtensions } = usePluginManager()

function getCustomOpenApiExtensionComponents(
  value: Record<string, any> | undefined,
) {
  const customExtensionNames = Object.keys(value ?? {}).filter((item) =>
    item.startsWith('x-'),
  ) as `x-${string}`[]

  return customExtensionNames
    .flatMap((name) => getOpenApiExtensions(name))
    .filter((extension) => extension.component)
}
</script>
<template>
  <template v-if="typeof value === 'object'">
    <template v-for="extension in getCustomOpenApiExtensionComponents(value)">
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
