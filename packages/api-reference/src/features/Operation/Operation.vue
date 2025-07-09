<script lang="ts" setup>
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { isReference } from '@scalar/workspace-store/schemas/v3.1/type-guard'
import { computed } from 'vue'

import { useOperationDiscriminator } from '@/hooks/useOperationDiscriminator'
import { useStore } from '@/v2/hooks/useStore'

import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  layout = 'modern',
  document,
  server,
  isWebhook,
  path,
  method,
} = defineProps<{
  path: string
  method: HttpMethod
  isWebhook?: boolean
  layout?: 'modern' | 'classic'
  id: string
  server: Server | undefined
  /** @deprecated Use the new workspace store instead*/
  document?: OpenAPIV3_1.Document
}>()

const { resolve, workspace } = useStore()

/**
 * Operation from the new workspace store
 */
const operation = computed(() => {
  const initialKey = isWebhook ? 'webhooks' : 'paths'
  const entity = workspace.activeDocument?.[initialKey]?.[path]?.[method]

  return entity
})

/**
 * Handle the selection of discriminator in the request body (anyOf, oneOf…)
 */
const { handleDiscriminatorChange } = useOperationDiscriminator(
  // TODO update this to use the new store
  isWebhook
    ? document?.webhooks?.[path]?.[method]
    : document?.paths?.[path]?.[method],
  document?.components?.schemas,
)
</script>

<template>
  <template v-if="operation">
    <template v-if="layout === 'classic'">
      <ClassicLayout
        :id="id"
        :isWebhook="isWebhook"
        :method="method"
        :operation="operation"
        :path="path"
        :schemas="document?.components?.schemas"
        :server="server"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
    <template v-else>
      <ModernLayout
        :id="id"
        :isWebhook="isWebhook"
        :method="method"
        :path="path"
        :operation="operation"
        :schemas="document?.components?.schemas"
        :server="server"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
  </template>
</template>
