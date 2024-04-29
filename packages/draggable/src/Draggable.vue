<script setup lang="ts">
import { useThrottleFn } from '@vueuse/core'
import { computed } from 'vue'

const props = defineProps<{
  /**
   * Upper threshold (gets multiplied with height)
   *
   * @default 0.8
   */
  ceiling: number
  /**
   * Lower threshold (gets multiplied with height)
   *
   * @default 0.2
   */
  floor: number
  /**
   * Height of individual items (not including children)
   *
   * @default 30
   */
  height: number
  /**
   * The item we are currently dragging
   */
  draggingItem?: DraggingItem | null
  /**
   * The item that is currently being hovered over by the dragging item
   */
  hoveredItem?: HoveredItem | null
  /**
   * We pass an array of parents to make it easier to reverse traverse
   */
  parentIds: string[]
  id: string
}>()

const emit = defineEmits<{
  /**
   * Set the item which is currently dragging
   */
  dragging: [draggingItem: DraggingItem | null]
  /**
   * We emit our own draggingEnded event instead of using native @drop
   */
  draggingEnded: []
  hover: [hoveredItem: HoveredItem | null]
}>()

export type HoveredItem = {
  id: string
  parentId: string | null
  /**
   * Offset is used when adding back an item, also for the highlight classes
   * 0 = above      | .dragover-above
   * 1 = below      | .dragover-below
   * 2 = as a child | .dragover-asChild
   */
  offset: number
}

export type DraggingItem = Omit<HoveredItem, 'offset'>

// The latest parentId in the arr should be the current parent
const parentId = computed(() =>
  (props.parentIds.length ?? 0) > 0
    ? props.parentIds[props.parentIds.length - 1]
    : null,
)

// Start draggin, we want to store the uid + parentUid
const onDragStart = (ev: DragEvent) => {
  if (!ev.dataTransfer || !(ev.target instanceof HTMLDivElement)) return

  ev.target.classList.add('dragging')
  ev.dataTransfer.dropEffect = 'move'
  ev.dataTransfer.effectAllowed = 'move'

  // Store dragging item
  emit('dragging', { id: props.id, parentId: parentId.value })
}

const FLOOR = props.floor * props.height
const CEILING = props.ceiling * props.height

// On dragging over we decide which highlight to show
const onDragOver = useThrottleFn((ev) => {
  // Don't highlight if hovering over self or child
  if (
    props.draggingItem?.id === props.id ||
    props.parentIds.includes(props.draggingItem?.id ?? '')
  )
    return

  const previousOffset = props.hoveredItem?.offset

  // As a child
  let offset = 3

  // handle negative offset to be previous offset
  if (ev.offsetY <= 0 && !!previousOffset && previousOffset !== 3) {
    offset = previousOffset
  }
  // Above
  else if (ev.offsetY <= FLOOR) {
    offset = 0
  }
  // Below
  else if (ev.offsetY >= CEILING) {
    offset = 1
  }
  // between
  else if (ev.offsetY > FLOOR && ev.offsetY < CEILING) {
    offset = 2
  }

  emit('hover', { id: props.id, parentId: parentId.value, offset })
}, 25)

// Set above middle below classes based on offset
const positionDict = ['above', 'below', 'asChild']
const containerClass = computed(() => {
  let classList = 'sidebar-indent-nested'

  if (props.id === props.hoveredItem?.id) {
    classList += ` dragover-${positionDict[props.hoveredItem.offset]}`
  }

  return classList
})
</script>

<template>
  <div
    :class="containerClass"
    draggable="true"
    @dragend="$emit('draggingEnded')"
    @dragover.prevent.stop="onDragOver"
    @dragstart.stop="onDragStart"></div>
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
