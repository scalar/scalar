<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ComponentsObject,
  TraversedDescription,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { Lazy } from '@/components/Lazy'
import { useNavState } from '@/hooks/useNavState'
import { useSidebar } from '@/v2/blocks/scalar-sidebar-block'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const { schemas = {} } = defineProps<{
  schemas: ComponentsObject['schemas']
  config: ApiReferenceConfiguration
}>()

const { hash } = useNavState()

const { items } = useSidebar()

const modelEntry = computed(() => {
  return items.value.entries.find(
    (item) => item.type === 'text' && item.id === 'models',
  ) as TraversedDescription | undefined
})

/** Array of the name and value of all component schemas */
const models = computed(() => {
  const modelEntries = modelEntry.value?.children ?? []

  return modelEntries
    .filter((it) => it.type === 'model')
    .map((it) => ({
      id: it.id,
      name: it.name,
      schema: getResolvedRef(schemas[it.name]),
    }))
})
</script>
<template>
  <Lazy
    v-if="schemas && Object.keys(schemas).length > 0"
    id="models"
    :isLazy="Boolean(hash) && !hash.startsWith('model')">
    <ClassicLayout
      v-if="config?.layout === 'classic'"
      :models="models" />
    <ModernLayout
      v-else
      :config="config"
      :schemas="models" />
  </Lazy>
</template>
