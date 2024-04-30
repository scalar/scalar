<script setup lang="ts">
import { ref } from 'vue'

import Draggable, { type DraggingItem, type HoveredItem } from './Draggable.vue'

/**
 * This component keeps track of higher level state for DraggingItem
 */
defineProps<{
  /**
   * List of ids to iterate on
   */
  itemIds: string[]
}>()

const emit = defineEmits<{
  onDragEnd: [draggingItem: DraggingItem, hoveredItem: HoveredItem]
  onDragStart: [draggingItem: DraggingItem]
}>()

defineSlots<{ default: [id: string] }>()

// Item you are currently dragging
const draggingItem = ref<DraggingItem | null>(null)
// Item you are currently dragging over
const hoveredItem = ref<HoveredItem | null>(null)

const onDragEnd = () => {
  if (!hoveredItem.value || !draggingItem.value) return

  const { id: draggingUid } = draggingItem.value
  const { id: hoveredUid } = hoveredItem.value

  // Remove hover and dragging
  draggingItem.value = null
  hoveredItem.value = null
  document
    .querySelectorAll('div.dragging')
    .forEach((el) => el.classList.remove('dragging'))

  if (draggingUid === hoveredUid) return

  emit('onDragEnd', draggingItem.value!, hoveredItem.value!)
}
</script>

<template>
  <ul
    @dragenter.prevent
    @dragover.prevent>
    <Draggable
      v-for="id in itemIds"
      :id="id"
      :key="id"
      :ceiling="ceiling"
      :draggingItem="draggingItem"
      :floor="floor"
      :height="height"
      :hoveredItem="hoveredItem"
      :parentIds="[]"
      @dragging="
        (d: DraggingItem | null) => {
          draggingItem = d
          if (d) $emit('onDragStart', d)
        }
      "
      @draggingEnded="onDragEnd"
      @hover="(h: HoveredItem | null) => (hoveredItem = h)">
      <template #default="{ id, level }">
        <slot
          :id="id"
          :level="level" />
      </template>
    </Draggable>
  </ul>
</template>
