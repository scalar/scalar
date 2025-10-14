<script lang="ts" setup>
import { ref } from 'vue'

const { width } = defineProps<{
  /** Provided resizable child width */
  width: number
}>()

const emit = defineEmits<{
  (e: 'update:width', value: number): void
}>()

defineSlots<{
  default?(): unknown
}>()

const isDragging = ref(false)

const draggingClassName = 'scalar-dragging'

const startDrag = (event: MouseEvent) => {
  event.preventDefault()

  const startX = event.clientX

  /** Current sidebar width when dragging starts */
  const startWidth = width

  const doDrag = (dragEvent: MouseEvent) => {
    isDragging.value = true
    document.body.classList.add(draggingClassName)
    let newWidth = startWidth + dragEvent.clientX - startX
    if (newWidth > 420) {
      /** Elastic effect */
      newWidth = 420 + (newWidth - 420) * 0.2
    }
    if (newWidth < 240) {
      newWidth = 240
    }
    emit('update:width', newWidth)
  }

  const stopDrag = () => {
    isDragging.value = false
    document.body.classList.remove(draggingClassName)
    document.documentElement.removeEventListener('mousemove', doDrag, false)
    document.documentElement.removeEventListener('mouseup', stopDrag, false)
    /** Reset to max width if exceeded */
    if (width > 420) {
      emit('update:width', 360)
    } else if (width < 240) {
      emit('update:width', 240)
    }
  }

  document.documentElement.addEventListener('mousemove', doDrag, false)
  document.documentElement.addEventListener('mouseup', stopDrag, false)
}
</script>
<template>
  <div
    class="relative"
    :style="{
      width: `${width}px`,
    }">
    <slot name="default" />
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
</style>
<style>
.scalar-dragging {
  cursor: col-resize;
}

.resizer:hover,
.scalar-dragging .resizer {
  border-right-color: var(--scalar-background-3);
}

.scalar-dragging::after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
