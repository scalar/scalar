<script setup lang="ts">
import { ScalarSidebar, ScalarSidebarGroup } from '@scalar/components'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

import type { SidebarState } from '../helpers/create-sidebar-state'
import SidebarBlock from './SidebarBlock.vue'

type Item =
  | TraversedEntry
  | { id: string; title: string; children: TraversedEntry[]; type: 'document' }

const {
  documents,
  state,
  indent = 20,
} = defineProps<{
  /** Mapping of document names to the corresponding TraversedEntry arrays */
  items: Item[]
  /** Sidebar state */
  state: SidebarState
  indent?: number
}>()
</script>

<template>
  <ScalarSidebar
    class="t-doc__sidebar"
    :style="{
      '--scalar-sidebar-indent': indent + 'px',
      '--scalar-sidebar-indent-border-hover': 'var(--scalar-color-3)',
      '--scalar-sidebar-indent-border-active': 'var(--scalar-color-accent)',
    }">
    <div class="custom-scroll flex min-h-0 flex-1 flex-col overflow-x-clip">
      <slot name="search" />
      <slot>
        <div class="grid p-3">
          <ScalarSidebarGroup
            v-for="[name, document] in Object.entries(documents)"
            :key="name"
            class="flex flex-col">
            {{ name }}
            <template #items>
              <SidebarBlock
                layout="client"
                :state="state"
                :xNavigation="document" />
            </template>
          </ScalarSidebarGroup>
        </div>
        <!-- Spacer -->
        <div class="flex-1"></div>
      </slot>
    </div>
    <slot name="footer" />
  </ScalarSidebar>
</template>
