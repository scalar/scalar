<script setup lang="ts">
import { commandPaletteBus } from '@/libs/eventBusses/command-palette'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import type {
  Request,
  RequestExample,
} from '@scalar/oas-utils/entities/workspace/spec'
import { computed } from 'vue'

const props = defineProps<{
  item: Request | RequestExample
}>()

/** Add example */
const handleAddExample = () =>
  commandPaletteBus.emit({ commandName: 'Add Example' })

const handleItemRename = () => {
  console.log('rename')
}

const handleItemDuplicate = () => {
  console.log('duplicate')
}

const handleItemDelete = () => {
  console.log('delete')
}

const isRequest = computed(() => 'summary' in props.item)
</script>

<template>
  <ScalarDropdown teleport="#scalar-client">
    <ScalarButton
      class="z-10 hover:bg-b-3 transition-none p-1 group-hover:flex ui-open:flex absolute left-0 hidden -translate-x-full -ml-1"
      size="sm"
      variant="ghost"
      @click.stop>
      <ScalarIcon
        icon="Ellipses"
        size="sm" />
    </ScalarButton>
    <template #items>
      <ScalarDropdownItem
        v-if="isRequest"
        class="flex !gap-2"
        @click="handleAddExample">
        <ScalarIcon
          class="inline-flex"
          icon="Add"
          size="sm" />
        <span>Add Example</span>
      </ScalarDropdownItem>
      <ScalarDropdownItem class="flex !gap-2">
        <ScalarIcon
          class="inline-flex"
          icon="Edit"
          size="sm" />
        <span>Rename</span>
      </ScalarDropdownItem>
      <ScalarDropdownItem class="flex !gap-2">
        <ScalarIcon
          class="inline-flex"
          icon="Duplicate"
          size="sm" />
        <span>Duplicate</span>
      </ScalarDropdownItem>
      <ScalarDropdownDivider />
      <ScalarDropdownItem class="flex !gap-2">
        <ScalarIcon
          class="inline-flex"
          icon="Trash"
          size="sm" />
        <span>Delete</span>
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</template>
