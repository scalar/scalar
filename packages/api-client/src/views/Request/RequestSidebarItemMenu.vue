<script setup lang="ts">
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { commandPaletteBus } from '@/libs/eventBusses/command-palette'
import { PathId } from '@/router'
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarModal,
  ScalarTextField,
  useModal,
} from '@scalar/components'
import type {
  Request,
  RequestExample,
} from '@scalar/oas-utils/entities/workspace/spec'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  item: Request | RequestExample
}>()

const {
  activeWorkspace,
  activeRouterParams,
  findRequestFolders,
  requestMutators,
  requestExampleMutators,
} = useWorkspace()
const { replace } = useRouter()

/** Add example */
const handleAddExample = () =>
  commandPaletteBus.emit({
    commandName: 'Add Example',
    metaData: props.item.uid,
  })

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
const itemName = computed(() => {
  if ('summary' in props.item) return props.item.summary || ''
  if ('name' in props.item) return props.item.name || ''
  return ''
})

const tempName = ref('')

const handleItemRename = () => {
  // rename request
  if ('summary' in props.item) {
    requestMutators.edit(props.item.uid, 'summary', tempName.value)
  } else if (!('summary' in props.item)) {
    // rename example
    requestExampleMutators.edit(props.item.uid, 'name', tempName.value)
  }
  tempName.value = ''
  renameModal.hide()
}

const renameModal = useModal()
const deleteModal = useModal()
const openRenameModal = () => {
  tempName.value = itemName.value
  renameModal.show()
}
</script>

<template>
  <ScalarDropdown teleport="#scalar-client">
    <ScalarButton
      class="z-10 hover:bg-b-3 transition-none p-1 group-hover:flex ui-open:flex absolute left-0 hidden -translate-x-full -ml-1"
      size="sm"
      variant="ghost">
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
        @click="openRenameModal">
        <ScalarIcon
          class="inline-flex"
          icon="Edit"
          size="sm" />
        <span>Rename</span>
      </ScalarDropdownItem>

      <!-- Duplicate -->
      <!-- <ScalarDropdownItem
        class="flex !gap-2"
        @click="handleItemDuplicate">
        <ScalarIcon
          class="inline-flex"
          icon="Duplicate"
          size="sm" />
        <span>Duplicate</span>
      </ScalarDropdownItem>
      <ScalarDropdownDivider /> -->

      <!-- Delete -->
      <ScalarDropdownItem
        class="flex !gap-2"
        @click="deleteModal.show()">
        <ScalarIcon
          class="inline-flex"
          icon="Trash"
          size="sm" />
        <span>Delete</span>
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
  <ScalarModal
    :size="'sm'"
    :state="deleteModal"
    :title="isRequest ? 'Delete Request' : 'Delete Example'">
    <DeleteSidebarListElement
      :variableName="itemName"
      @close="deleteModal.hide()"
      @delete="handleItemDelete" />
  </ScalarModal>
  <ScalarModal
    :state="renameModal"
    :title="isRequest ? 'Rename Request' : 'Rename Example'">
    <ScalarTextField
      v-model="tempName"
      :label="isRequest ? 'Request' : 'Example'" />
    <div class="flex gap-3">
      <ScalarButton
        class="flex-1"
        variant="outlined"
        @click="renameModal.hide()">
        Cancel
      </ScalarButton>
      <ScalarButton
        class="flex-1"
        type="submit"
        @click="handleItemRename">
        Save
      </ScalarButton>
    </div>
  </ScalarModal>
</template>
