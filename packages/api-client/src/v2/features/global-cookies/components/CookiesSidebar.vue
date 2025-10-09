<script setup lang="ts">
import {
  ScalarSidebar,
  ScalarSidebarItem,
  ScalarSidebarItems,
  ScalarSidebarSection,
} from '@scalar/components'
import { ScalarIconFolder, ScalarIconGlobe } from '@scalar/icons'
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'
import { ref } from 'vue'

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

const emits = defineEmits<{
  (e: 'update:width', value: number): void
  (e: 'update:selection', value: string | null): void
}>()

defineSlots<{
  default?(): unknown
}>()

const isDragging = ref(false)

const { breakpoints } = useBreakpoints()

const startDrag = (event: MouseEvent) => {
  event.preventDefault()

  const startX = event.clientX

  /** Current sidebar width when dragging starts */
  const startWidth = width

  const doDrag = (dragEvent: MouseEvent) => {
    isDragging.value = true
    document.body.classList.add('dragging')
    let newWidth = startWidth + dragEvent.clientX - startX
    if (newWidth > 420) {
      /** Elastic effect */
      newWidth = 420 + (newWidth - 420) * 0.2
    }
    if (newWidth < 240) {
      newWidth = 240
    }
    emits('update:width', newWidth)
  }

  const stopDrag = () => {
    isDragging.value = false
    document.body.classList.remove('dragging')
    document.documentElement.removeEventListener('mousemove', doDrag, false)
    document.documentElement.removeEventListener('mouseup', stopDrag, false)
    /** Reset to max width if exceeded */
    if (width > 420) {
      emits('update:width', 360)
    } else if (width < 240) {
      emits('update:width', 240)
    }
  }

  document.documentElement.addEventListener('mousemove', doDrag, false)
  document.documentElement.addEventListener('mouseup', stopDrag, false)
}

const sidebarRef = ref<HTMLElement | null>(null)
</script>
<template>
  <div
    ref="sidebarRef"
    class="relative"
    :style="{
      width: `${width}px`,
      /** Hide sidebar on smaller screens */
      display: breakpoints.lg ? 'block' : 'none',
    }">
    <ScalarSidebar class="h-full w-full">
      <div class="custom-scroll flex min-h-0 flex-1 flex-col overflow-x-clip">
        <slot>
          <ScalarSidebarItems>
            <ScalarSidebarSection>
              {{ title }}
              <template #items>
                <ScalarSidebarItem
                  is="button"
                  :active="!documentName"
                  @click="() => emits('update:selection', null)">
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
                  @click="() => emits('update:selection', doc)">
                  <template #icon>
                    <ScalarIconFolder />
                  </template>
                  {{ doc }}
                </ScalarSidebarItem>
              </template>
            </ScalarSidebarSection>
          </ScalarSidebarItems>
          <!-- Spacer -->
          <div class="flex-1"></div>
        </slot>
      </div>
    </ScalarSidebar>
    <div
      class="resizer"
      @mousedown="startDrag" />
  </div>
</template>
<style scoped>
.resizer {
  width: 5px;
  cursor: col-resize;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  border-right: 2px solid transparent;
  transition: border-right-color 0.3s;
}
.resizer:hover,
.dragging .resizer {
  border-right-color: var(--scalar-background-3);
}
</style>
<style>
.dragging {
  cursor: col-resize;
}

.dragging::after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
