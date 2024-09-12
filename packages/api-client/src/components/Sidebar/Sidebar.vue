<script setup lang="ts">
import { useWorkspace } from '@/store/workspace'
import { defineProps, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    showSideBar?: boolean
  }>(),
  {
    showSideBar: true,
  },
)
const { isReadOnly, sidebarWidth, setSidebarWidth } = useWorkspace()
const isDragging = ref(false)
const sidebarRef = ref<HTMLElement | null>(null)

const startDrag = (event: MouseEvent) => {
  event.preventDefault()

  const startX = event.clientX
  /** Current sidebar width when dragging starts */
  const startWidth = parseInt(
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
    if (parseInt(sidebarWidth.value, 10) > 420) {
      setSidebarWidth('360px')
    } else if (parseInt(sidebarWidth.value, 10) < 240) {
      setSidebarWidth('240px')
    }
  }

  document.documentElement.addEventListener('mousemove', doDrag, false)
  document.documentElement.addEventListener('mouseup', stopDrag, false)
}
</script>
<template>
  <aside
    v-show="props.showSideBar"
    ref="sidebarRef"
    class="sidebar overflow-hidden relative flex flex-col border-r-1/2 bg-b-1"
    :class="{ dragging: isDragging }"
    :style="{ width: sidebarWidth }">
    <slot name="header" />
    <div
      v-if="!isReadOnly && title"
      class="xl:min-h-header py-2.5 flex items-center border-b-1/2 px-4 text-sm">
      <h2 class="font-medium m-0 text-sm whitespace-nowrap">
        {{ title }}
      </h2>
    </div>
    <div
      class="custom-scroll sidebar-height"
      :class="{
        'sidebar-mask': !isReadOnly,
      }">
      <slot name="content" />
    </div>
    <slot name="button" />
    <div
      class="resizer"
      @mousedown="startDrag"></div>
  </aside>
</template>
<style scoped>
.sidebar-height {
  min-height: calc(100% - 50px);
}
.sidebar-mask {
  padding-bottom: 42px;
  mask-image: linear-gradient(
    0,
    transparent 0,
    transparent 40px,
    var(--scalar-background-2) 60px
  );
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
  z-index: 100;
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
  z-index: 99;
}
</style>
