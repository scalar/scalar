<script setup lang="ts">
import { ScalarSidebarItem } from '@scalar/components'
import { ScalarIconFolder, ScalarIconGlobe } from '@scalar/icons'

import { Sidebar } from '@/v2/components/sidebar'

const { width = 300 } = defineProps<{
  /** Sidebar title */
  title?: string
  /** Current document name */
  documentName?: string | null
  /** List of all document names */
  documents: string[]
  /** Provided sidebar width */
  width?: number
}>()

const emit = defineEmits<{
  (e: 'update:width', value: number): void
  (e: 'update:selection', value: string | null): void
}>()

defineSlots<{
  default?(): unknown
}>()
</script>
<template>
  <Sidebar
    :title="title"
    :width="width"
    @update:width="(value) => emit('update:width', value)">
    <template #default>
      <ScalarSidebarItem
        is="button"
        :active="!documentName"
        @click="() => emit('update:selection', null)">
        <template #icon>
          <ScalarIconGlobe />
        </template>
        Workspace cookies
      </ScalarSidebarItem>
      <ScalarSidebarItem
        is="button"
        v-for="doc in documents"
        :key="doc"
        :active="doc === documentName"
        @click="() => emit('update:selection', doc)">
        <template #icon>
          <ScalarIconFolder />
        </template>
        {{ doc }}
      </ScalarSidebarItem>
    </template>
  </Sidebar>
</template>
