<script setup lang="ts">
import { commandPaletteBus } from '@/libs/event-busses'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import type { Folder } from '@scalar/oas-utils/entities/workspace/folder'
import type {
  Request,
  RequestExample,
} from '@scalar/oas-utils/entities/workspace/spec'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Both inidicate the level and provide a way to traverse upwards */
    item: Collection | Folder | Request | RequestExample
    resourceTitle: string
    static?: boolean
  }>(),
  { static: false },
)

const emit = defineEmits<{
  (event: 'delete'): void
  (event: 'rename'): void
}>()

/** Add example */
const handleAddExample = () =>
  commandPaletteBus.emit({
    commandName: 'Add Example',
    metaData: props.item.uid,
  })

const isRequest = computed(() => 'summary' in props.item)
</script>

<template>
  <ScalarDropdown
    :static="static"
    :teleport="!static ?? '#scalar-client'">
    <ScalarButton
      class="px-0.5 py-0 z-10 hover:bg-b-3 hidden group-hover:flex ui-open:flex absolute -translate-y-1/2 right-0 aspect-square inset-y-2/4 h-fit"
      size="sm"
      variant="ghost"
      @click="
        (ev) => {
          // We must stop propagation on folders and collections to prevent them from toggling
          if (
            props.resourceTitle === 'Collection' ||
            props.resourceTitle === 'Folder'
          )
            ev.stopPropagation()
        }
      ">
      <ScalarIcon
        icon="Ellipses"
        size="sm" />
    </ScalarButton>
    <template #items>
      <!-- Add example -->
      <ScalarDropdownItem
        v-if="isRequest"
        class="flex gap-2"
        @click="handleAddExample">
        <ScalarIcon
          class="inline-flex"
          icon="Example"
          size="md"
          thickness="1.5" />
        <span>Add Example</span>
      </ScalarDropdownItem>

      <!-- Rename -->
      <ScalarDropdownItem
        class="flex gap-2"
        @click="emit('rename')">
        <ScalarIcon
          class="inline-flex"
          icon="Edit"
          size="md"
          thickness="1.5" />
        <span>Rename</span>
      </ScalarDropdownItem>

      <!-- Duplicate -->
      <!-- <ScalarDropdownItem
        class="flex !gap-2"
        @click="handleItemDuplicate">
        <ScalarIcon
          class="inline-flex"
          thickness="1.5"
          icon="Duplicate"
          size="sm" />
        <span>Duplicate</span>
      </ScalarDropdownItem>
      <ScalarDropdownDivider /> -->

      <!-- Delete -->
      <ScalarDropdownItem
        class="flex gap-2"
        @click="emit('delete')">
        <ScalarIcon
          class="inline-flex"
          icon="Delete"
          size="md"
          thickness="1.5" />
        <span>Delete</span>
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</template>
<style scoped>
.ellipsis-position {
  transform: translate3d(calc(-100% - 4.5px), 0, 0);
}
</style>
