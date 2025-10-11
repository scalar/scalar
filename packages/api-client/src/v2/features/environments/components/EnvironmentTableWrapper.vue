<script lang="ts" setup>
import { ScalarButton } from '@scalar/components'
import { Draggable } from '@scalar/draggable'
import { ScalarIconTrash } from '@scalar/icons'

defineProps<{
  name: string
  color?: string
}>()

const emit = defineEmits<{
  (e: 'delete'): void
  (e: 'edit:name'): void
  (e: 'edit:color'): void
  (
    e: 'reorder',
    draggingItem: { id: string },
    hoveredItem: { id: string },
  ): void
}>()

defineSlots<{
  default?(): unknown
}>()

const handleDragEnd = (
  draggingItem: { id: string },
  hoveredItem: { id: string },
) => {
  emit('reorder', draggingItem, hoveredItem)
}
</script>
<template>
  <Draggable
    :id="name"
    class="rounded-lg border"
    :isDraggable="true"
    :isDroppable="true"
    :parentIds="[]"
    @onDragEnd="handleDragEnd">
    <div
      class="bg-b-2 flex cursor-grab justify-between rounded-t-lg px-1 py-1 text-sm">
      <div class="flex items-center gap-1">
        <ScalarButton
          class="hover:bg-b-3 flex h-6 w-6 p-1"
          variant="ghost"
          @click="emit('edit:color')">
          <span
            class="h-2.5 w-2.5 rounded-full"
            :style="{ backgroundColor: color || '#FFFFFF' }"></span>
        </ScalarButton>
        <ScalarButton
          class="hover:bg-b-3 rounded px-1 py-0.5 text-sm"
          variant="ghost"
          @click="emit('edit:name')">
          {{ name }}
        </ScalarButton>
      </div>
      <ScalarButton
        class="text-c-2 hover:text-c-1 hover:bg-b-3 h-fit rounded p-1"
        size="sm"
        variant="ghost"
        @click="emit('delete')">
        <ScalarIconTrash class="size-3.5" />
      </ScalarButton>
    </div>
    <slot name="default" />
  </Draggable>
</template>
