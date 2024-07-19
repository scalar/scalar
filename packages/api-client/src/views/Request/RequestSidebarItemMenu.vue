<script setup lang="ts">
import { commandPaletteBus } from '@/libs/eventBusses/command-palette'
import { PathId, activeRouterParams } from '@/router'
import { findRequestFolders, useWorkspace } from '@/store/workspace'
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
import { useRouter } from 'vue-router'

const props = defineProps<{
  item: Request | RequestExample
}>()

const { activeWorkspace, requestMutators, requestExampleMutators } =
  useWorkspace()
const { replace } = useRouter()

/** Add example */
const handleAddExample = () =>
  commandPaletteBus.emit({ commandName: 'Add Example' })

const handleItemRename = () => {
  console.log('rename')
}

const handleItemDuplicate = () => {
  console.log('duplicate')
}

/** Delete handles both requests and requestExamples */
const handleItemDelete = () => {
  // Delete example
  if ('requestUid' in props.item) {
    requestExampleMutators.delete(props.item)
    if (activeRouterParams.value[PathId.Examples] === props.item.uid) {
      replace(`/workspace/${activeWorkspace.value}/request/default`)
    }
  }
  // Delete request
  else {
    // We need to find out what the parent is first
    const uids = findRequestFolders(props.item.uid)
    if (!uids.length) return

    requestMutators.delete(props.item, uids[0])
    if (activeRouterParams.value[PathId.Request] === props.item.uid) {
      replace(`/workspace/${activeWorkspace.value.uid}/request/default`)
    }
  }
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
      <!-- Add example -->
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

      <!-- Rename -->
      <ScalarDropdownItem
        class="flex !gap-2"
        @click="handleItemRename">
        <ScalarIcon
          class="inline-flex"
          icon="Edit"
          size="sm" />
        <span>Rename</span>
      </ScalarDropdownItem>

      <!-- Duplicate -->
      <ScalarDropdownItem
        class="flex !gap-2"
        @click="handleItemDuplicate">
        <ScalarIcon
          class="inline-flex"
          icon="Duplicate"
          size="sm" />
        <span>Duplicate</span>
      </ScalarDropdownItem>
      <ScalarDropdownDivider />

      <!-- Delete -->
      <ScalarDropdownItem
        class="flex !gap-2"
        @click="handleItemDelete">
        <ScalarIcon
          class="inline-flex"
          icon="Trash"
          size="sm" />
        <span>Delete</span>
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</template>
