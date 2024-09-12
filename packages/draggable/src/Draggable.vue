<script setup lang="ts">
import { computed } from 'vue'

import {
  type DraggingItem,
  type HoveredItem,
  draggingItem,
  hoveredItem,
} from './store'
import { throttle } from './throttle'

export type DraggableProps = {
  /**
   * Upper threshold (gets multiplied with height)
   *
   * @default 0.8
   */
  ceiling?: number
  /**
   * Lower threshold (gets multiplied with height)
   *
   * @default 0.2
   */
  floor?: number
  /**
   * Disable dragging by setting to false
   *
   * @default true
   */
  isDraggable?: boolean
  /**
   * Prevents items from being hovered and dropped into. Can be either a function or a boolean
   *
   * @default true
   */
  isDroppable?:
    | boolean
    | ((draggingItem: DraggingItem, hoveredItem: HoveredItem) => boolean)
  /**
   * We pass an array of parents to make it easier to reverse traverse
   */
  parentIds: string[]
  /**
   * ID for the current item
   */
  id: string
}
const props = withDefaults(defineProps<DraggableProps>(), {
  ceiling: 0.8,
  floor: 0.2,
  isDraggable: true,
  isDroppable: true,
})

const emit = defineEmits<{
  /**
   * We emit our own draggingEnded event instead of using native @drop
   */
  onDragEnd: [draggingItem: DraggingItem, hoveredItem: HoveredItem]
  onDragStart: [draggingItem: DraggingItem]
}>()

// The latest parentId in the arr should be the current parent
const parentId = computed(() =>
  (props.parentIds.length ?? 0) > 0
    ? props.parentIds[props.parentIds.length - 1]
    : null,
)

// Start draggin, we want to store the uid + parentUid
const onDragStart = (ev: DragEvent) => {
  if (
    !ev.dataTransfer ||
    !(ev.target instanceof HTMLElement) ||
    !props.isDraggable
  )
    return

  ev.target.classList.add('dragging')
  ev.dataTransfer.dropEffect = 'move'
  ev.dataTransfer.effectAllowed = 'move'

  // Store dragging item
  draggingItem.value = { id: props.id, parentId: parentId.value }
  emit('onDragStart', { id: props.id, parentId: parentId.value })
}

/** Check if isDroppable guard */
const _isDroppable = (offset: number) =>
  typeof props.isDroppable === 'function'
    ? props.isDroppable(draggingItem.value!, {
        id: props.id,
        parentId: parentId.value,
        offset,
      })
    : props.isDroppable

// On dragging over we decide which highlight to show
const onDragOver = throttle((ev: DragEvent) => {
  // Don't highlight if hovering over self or child
  if (
    !draggingItem.value ||
    draggingItem.value.id === props.id ||
    props.parentIds.includes(draggingItem.value?.id ?? '')
  )
    return

  const previousOffset = hoveredItem.value?.offset
  const height = (ev.target as HTMLDivElement).offsetHeight
  const floor = props.floor * height
  const ceiling = props.ceiling * height
  let offset = 3

  // handle negative offset to be previous offset
  if (ev.offsetY <= 0 && !!previousOffset && previousOffset !== 3) {
    offset = previousOffset
  }
  // Above
  else if (ev.offsetY <= floor) {
    offset = 0
  }
  // Below
  else if (ev.offsetY >= ceiling) {
    offset = 1
  }
  // between
  else if (ev.offsetY > floor && ev.offsetY < ceiling) {
    offset = 2
  }

  // Hover guard
  if (!_isDroppable(offset)) return

  hoveredItem.value = { id: props.id, parentId: parentId.value, offset }
}, 25)

// Set above middle below classes based on offset
const positionDict = ['above', 'below', 'asChild']
const containerClass = computed(() => {
  let classList = 'sidebar-indent-nested'

  if (props.id === hoveredItem.value?.id) {
    classList += ` dragover-${positionDict[hoveredItem.value.offset]}`
  }

  return classList
})

const onDragEnd = () => {
  if (!hoveredItem.value || !draggingItem.value) return

  const _draggingItem = { ...draggingItem.value }
  const _hoveredItem = { ...hoveredItem.value }

  // Remove hover and dragging
  draggingItem.value = null
  hoveredItem.value = null
  document
    .querySelectorAll('div.dragging')
    .forEach((el) => el.classList.remove('dragging'))

  if (_draggingItem.id === _hoveredItem.id) return

  emit('onDragEnd', _draggingItem, _hoveredItem)
}

/** Define dragging and hovered items for more complicated logic */
defineExpose({
  draggingItem,
  hoveredItem,
})
</script>

<template>
  <div
    :class="containerClass"
    :draggable="isDraggable"
    @dragend="onDragEnd"
    @dragover.prevent.stop="onDragOver"
    @dragstart.stop="onDragStart">
    <slot />
  </div>
</template>

<style scoped>
.dragover-asChild,
.dragover-above,
.dragover-below {
  position: relative;
}
.dragover-above:after,
.dragover-below:after {
  content: '';
  position: absolute;
  top: -1.5px;
  height: 3px;
  width: 100%;
  display: block;
  background: color-mix(in srgb, var(--scalar-color-blue), transparent 85%);
  pointer-events: none;
  border-radius: var(--scalar-radius);
}
.dragover-below:after {
  top: initial;
  bottom: -1.5px;
}
.dragover-asChild:after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  background: color-mix(in srgb, var(--scalar-color-blue), transparent 85%);
  pointer-events: none;
  border-radius: var(--scalar-radius);
}
</style>
