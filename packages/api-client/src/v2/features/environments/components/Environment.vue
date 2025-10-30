<script lang="ts" setup>
import { ScalarIconButton } from '@scalar/components'
import { Draggable } from '@scalar/draggable'
import { ScalarIconNotePencil, ScalarIconTrash } from '@scalar/icons'
import type {
  CollectionType,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'

import EnvironmentVariablesTable from '@/v2/features/environments/components/EnvironmentVariablesTable.vue'

const { environmentName, environment, eventBus, type } = defineProps<
  {
    environment: XScalarEnvironment
    environmentName: string
    eventBus: WorkspaceEventBus
  } & CollectionType
>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
}>()

/** Handle drag end event to reorder environments */
const handleDragEnd = (
  draggingItem: { id: string },
  hoveredItem: { id: string },
) => {
  eventBus.emit('environment:update:environment-order', {
    draggingItem,
    hoveredItem,
    type,
  })
}
</script>
<template>
  <Draggable
    :id="environmentName"
    class="group rounded-lg border"
    :isDraggable="true"
    :isDroppable="true"
    :parentIds="[]"
    @onDragEnd="handleDragEnd">
    <!-- Info -->
    <div
      class="bg-b-2 flex cursor-grab justify-between rounded-t-lg px-1 py-1 text-sm">
      <div class="flex items-center gap-1">
        <div class="flex h-6 w-6 items-center justify-center p-1">
          <span
            class="h-2.5 w-2.5 rounded-full"
            :style="{ backgroundColor: environment.color }"></span>
        </div>
        <span class="px-1 py-0.5 text-sm">
          {{ environmentName }}
        </span>
      </div>

      <!-- Actions -->
      <div class="hidden flex-row items-center gap-1 group-hover:flex">
        <ScalarIconButton
          :icon="ScalarIconNotePencil"
          label="Edit Environment"
          size="sm"
          @click="emit('edit')" />

        <ScalarIconButton
          :icon="ScalarIconTrash"
          label="Delete Environment"
          size="sm"
          @click="emit('delete')" />
      </div>
    </div>

    <!-- Variables Table -->
    <EnvironmentVariablesTable
      :environment="environment"
      :environmentName="environmentName"
      :eventBus="eventBus"
      :type="type" />
  </Draggable>
</template>
