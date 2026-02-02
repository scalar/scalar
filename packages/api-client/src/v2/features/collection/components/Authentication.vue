<script setup lang="ts">
import { ScalarToggle } from '@scalar/components'
import { computed } from 'vue'

import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import type { CollectionProps } from '@/v2/features/app/helpers/routes'

const { document, eventBus, environment, securitySchemes } =
  defineProps<CollectionProps>()

/** If enabled we use/set the selected security schemes on the document level */
const useDocumentSecurity = computed(
  () => document?.['x-scalar-set-operation-security'] ?? false,
)

/** Grab the currently selected server for relative auth URIs */
const server = computed(
  () =>
    document?.servers?.find(
      ({ url }) => url === document?.['x-scalar-selected-server'],
    ) ?? null,
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <div class="flex h-8 items-center justify-between">
        <h3 class="font-bold">Authentication</h3>
        <ScalarToggle
          class="w-4"
          :modelValue="useDocumentSecurity"
          @update:modelValue="
            () => eventBus.emit('document:toggle:security')
          " />
      </div>
      <p class="pr-6 text-sm">
        If enabled, all selected authentication will apply to all operations in
        this document. You can override this by disabling the toggle and
        authentication will then be applied at the operation level.
      </p>
    </div>

    <!-- Auth Selector -->
    <div :class="!useDocumentSecurity && 'cursor-not-allowed'">
      <AuthSelector
        class="scalar-collection-auth !border-none"
        :class="
          !useDocumentSecurity &&
          'pointer-events-none opacity-50 mix-blend-luminosity'
        "
        :environment
        :eventBus="eventBus"
        isStatic
        :meta="{ type: 'document' }"
        :proxyUrl="workspaceStore.workspace['x-scalar-active-proxy'] ?? ''"
        :securityRequirements="document?.security ?? []"
        :securitySchemes
        :selectedSecurity="
          workspaceStore.auth.getAuthSelectedSchemas({
            type: 'document',
            documentName: documentSlug,
          })
        "
        :server
        title="Authentication" />
    </div>
  </div>
</template>
<style scoped>
.scalar-collection-auth {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
}
</style>
