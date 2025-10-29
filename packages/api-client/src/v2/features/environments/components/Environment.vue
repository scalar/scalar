<script lang="ts" setup>
import { ScalarButton } from '@scalar/components'
import { Draggable } from '@scalar/draggable'
import { ScalarIconTrash } from '@scalar/icons'
import type {
  CollectionType,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'

import EnvironmentVariablesTable from '@/v2/features/environments/components/EnvironmentVariablesTable.vue'

const { name, environment, eventBus, type } = defineProps<
  {
    /** Environment name */
    name: string
    /** Environment */
    environment: XScalarEnvironment
    /** Event bus */
    eventBus: WorkspaceEventBus
  } & CollectionType
>()

const handleDragEnd = (
  draggingItem: { id: string },
  hoveredItem: { id: string },
) => {
  eventBus.emit('update:environment-order', { draggingItem, hoveredItem, type })
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
          v-if="!isReadonly"
          class="hover:bg-b-3 flex h-6 w-6 p-1"
          :disabled="isReadonly"
          variant="ghost"
          @click="emit('update:color')">
          <span
            class="h-2.5 w-2.5 rounded-full"
            :style="{ backgroundColor: color || '#FFFFFF' }"></span>
        </ScalarButton>
        <div
          v-else
          class="flex h-6 w-6 items-center justify-center p-1">
          <span
            class="h-2.5 w-2.5 rounded-full"
            :style="{ backgroundColor: color || '#FFFFFF' }"></span>
        </div>
        <ScalarButton
          v-if="!isReadonly"
          class="hover:bg-b-3 rounded px-1 py-0.5 text-sm"
          :disabled="isReadonly"
          variant="ghost"
          @click="emit('update:name')">
          {{ name }}
        </ScalarButton>
        <span
          v-else
          class="px-1 py-0.5 text-sm">
          {{ name }}
        </span>
      </div>
      <ScalarButton
        v-if="!isReadonly"
        class="text-c-2 hover:text-c-1 hover:bg-b-3 h-fit rounded p-1"
        size="sm"
        variant="ghost"
        @click="emit('delete')">
        <ScalarIconTrash class="size-3.5" />
      </ScalarButton>
    </div>
    <slot name="default">
      <EnvironmentVariablesTable
        :data="variables"
        :envVariables="envVariables"
        :environment="environment"
        @addRow="
          (data) => emit('add:variable', { name: data.name, value: data.value })
        "
        @deleteRow="(id) => emit('delete:variable', { id: id })"
        @updateRow="
          (id, data) =>
            emit('update:variable', {
              id: id,
              value: { name: data.name, value: data.value },
            })
        " />
    </slot>
  </Draggable>
</template>
