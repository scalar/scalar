<script setup lang="ts">
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'
import { ref } from 'vue'

import { useLayout } from '@/hooks/useLayout'
import { useSidebar } from '@/hooks/useSidebar'
import { useWorkspace } from '@/store'

defineProps<{
  title?: string
}>()

const { isSidebarOpen } = useSidebar()
const { sidebarWidth, setSidebarWidth } = useWorkspace()
const { layout } = useLayout()
const isDragging = ref(false)

const sidebarRef = ref<HTMLElement | null>(null)
const { breakpoints } = useBreakpoints()

const startDrag = (event: MouseEvent) => {
  event.preventDefault()

  const startX = event.clientX
  /** Current sidebar width when dragging starts */
  const startWidth = Number.parseInt(
    getComputedStyle(sidebarRef.value!).width || sidebarWidth.value,
    10,
  )

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
    setSidebarWidth(`${newWidth}px`)
  }

  const stopDrag = () => {
    isDragging.value = false
    document.body.classList.remove('dragging')
    document.documentElement.removeEventListener('mousemove', doDrag, false)
    document.documentElement.removeEventListener('mouseup', stopDrag, false)
    /** Reset to max width if exceeded */
    if (Number.parseInt(sidebarWidth.value, 10) > 420) {
      setSidebarWidth('360px')
    } else if (Number.parseInt(sidebarWidth.value, 10) < 240) {
      setSidebarWidth('240px')
    }
  }

  document.documentElement.addEventListener('mousemove', doDrag, false)
  document.documentElement.addEventListener('mouseup', stopDrag, false)
}
</script>
<template>
  <aside
    v-show="isSidebarOpen"
    ref="sidebarRef"
    class="sidebar bg-b-1 relative flex min-w-full flex-1 flex-col overflow-hidden leading-3 md:min-w-fit md:flex-none md:border-r md:border-b-0"
    :class="{ dragging: isDragging }"
    :style="{ width: breakpoints.lg ? sidebarWidth : '100%' }">
    <slot name="header" />
    <div
      v-if="layout !== 'modal' && title"
      class="xl:min-h-header flex min-h-12 items-center justify-between px-3 py-1.5 text-sm md:px-[18px] md:py-2.5">
      <h2 class="m-0 text-sm font-medium whitespace-nowrap">
        {{ title }}
      </h2>
      <slot
        v-if="!breakpoints.lg"
        name="button" />
    </div>
    <div
      class="custom-scroll sidebar-height w-[inherit] pb-0 md:pb-[37px]"
      :class="{
        'sidebar-mask': layout !== 'modal',
      }">
      <slot name="content" />
    </div>
    <template v-if="breakpoints.lg">
      <div
        class="bg-b-1 relative sticky bottom-0 z-10 w-[inherit] pt-0 has-[.empty-sidebar-item]:border-t md:px-2.5 md:pb-2.5">
        <slot name="button" />
      </div>
      <div
        class="resizer"
        @mousedown="startDrag" />
    </template>
  </aside>
</template>
<style scoped>
@reference "@/style.css";

.sidebar-height {
  min-height: 100%;
}
@variant md {
  .sidebar-mask {
    mask-image: linear-gradient(
      0,
      transparent 0,
      transparent 0,
      var(--scalar-background-2) 30px
    );
  }
}
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
.dragging {
  cursor: col-resize;
}
.dragging::before {
  content: '';
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
