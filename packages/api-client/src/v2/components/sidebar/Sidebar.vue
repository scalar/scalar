<script setup lang="ts">
import {
  ScalarSidebar,
  ScalarSidebarItems,
  ScalarSidebarSection,
} from '@scalar/components'
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'

import { Resize } from '@/v2/components/resize'

const { width = 300 } = defineProps<{
  /** Sidebar title */
  title?: string
  /** Provided sidebar width */
  width?: number
}>()

const emit = defineEmits<{
  (e: 'update:width', value: number): void
}>()

defineSlots<{
  default?(): unknown
  search?(): unknown
  footer?(): unknown
}>()

const { breakpoints } = useBreakpoints()
</script>
<template>
  <Resize
    :style="{
      display: breakpoints.lg ? 'block' : 'none',
    }"
    :width="width"
    @update:width="(value) => emit('update:width', value)">
    <template #default>
      <ScalarSidebar class="h-full w-full">
        <div class="custom-scroll flex min-h-0 flex-1 flex-col overflow-x-clip">
          <slot name="search" />
          <ScalarSidebarItems>
            <ScalarSidebarSection>
              {{ title }}
              <template #items>
                <slot name="default" />
              </template>
            </ScalarSidebarSection>
          </ScalarSidebarItems>
          <div class="flex-1"></div>
        </div>
        <slot name="footer" />
      </ScalarSidebar>
    </template>
  </Resize>
</template>
