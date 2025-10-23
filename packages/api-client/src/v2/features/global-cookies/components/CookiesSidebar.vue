<script setup lang="ts">
import { ScalarSidebarItem } from '@scalar/components'
import { ScalarIconFolder, ScalarIconGlobe } from '@scalar/icons'

import { Sidebar } from '@/v2/components/sidebar'

defineProps<{
  /** Sidebar title */
  title?: string
  /** Current document name */
  documentName?: string | null
  /** List of all document names */
  documents: string[]
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
    :documents="{}"
    :isSidebarOpen="true"
    layout="desktop"
    :title="title">
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
