<script setup lang="ts">
import {
  requestSchema,
  type Collection,
  type Server,
} from '@scalar/oas-utils/entities/spec'
import { schemaModel } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1, TransformedOperation } from '@scalar/types/legacy'
import { computed } from 'vue'

import ClassicLayout from '@/features/Operation/layouts/ClassicLayout.vue'
import ModernLayout from '@/features/Operation/layouts/ModernLayout.vue'
import type { Schemas } from '@/features/Operation/types/schemas'
import { useNavState } from '@/hooks/useNavState'

const {
  callback,
  collection,
  layout,
  method,
  name,
  parentId,
  schemas,
  server,
  url,
} = defineProps<{
  callback: OpenAPIV3_1.OperationObject
  collection: Collection
  layout: 'modern' | 'classic'
  method: string
  name: string
  parentId: string
  schemas?: Schemas
  server: Server | undefined
  url: string
}>()

const { getCallbackId } = useNavState()

/** This should get us 90% of the way there, will fix the rest on new store */
const operation = computed(() =>
  schemaModel({ ...callback, path: url, method }, requestSchema, false),
)
const transformedOperation = computed(
  () =>
    ({
      ...callback,
      path: url,
      httpVerb: method.toUpperCase() as TransformedOperation['httpVerb'],
    }) satisfies TransformedOperation,
)
</script>

<template>
  <template v-if="collection && operation">
    <ModernLayout
      v-if="layout === 'modern'"
      :id="getCallbackId(transformedOperation, name, parentId)"
      :collection="collection"
      :operation="operation"
      :schemas="schemas"
      :callbackName="name"
      :server="server"
      :transformedOperation="transformedOperation" />
    <ClassicLayout
      v-else
      :id="getCallbackId(transformedOperation, name, parentId)"
      :collection="collection"
      :operation="operation"
      :schemas="schemas"
      :server="server"
      :transformedOperation="transformedOperation" />
  </template>
</template>
