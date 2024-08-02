<script setup lang="ts">
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { commandPaletteBus } from '@/libs/event-busses'
import { PathId } from '@/router'
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarModal,
  ScalarTextField,
  useModal,
} from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import type { Folder } from '@scalar/oas-utils/entities/workspace/folder'
import type {
  Request,
  RequestExample,
} from '@scalar/oas-utils/entities/workspace/spec'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  /** Both inidicate the level and provide a way to traverse upwards */
  parentUids: string[]
  item: Collection | Folder | Request | RequestExample
}>()

const {
  activeWorkspace,
  activeRouterParams,
  collectionMutators,
  folderMutators,
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
  else if ('summary' in props.item) {
    requestMutators.delete(
      props.item,
      props.parentUids[props.parentUids.length - 1],
    )
    if (activeRouterParams.value[PathId.Request] === props.item.uid) {
      replace(`/workspace/${activeWorkspace.value.uid}/request/default`)
    }
  }
  // Delete Collection
  else if ('spec' in props.item) {
    collectionMutators.delete(props.item)
  }
  // Delete folder
  else if ('name' in props.item) {
    folderMutators.delete(
      props.item,
      props.parentUids[props.parentUids.length - 1],
    )
  }
}

const isRequest = computed(() => 'summary' in props.item)
const itemName = computed(() => {
  if ('summary' in props.item) return props.item.summary || ''
  if ('name' in props.item) return props.item.name || ''
  if ('spec' in props.item) return props.item.spec.info?.title || ''
  return ''
})

const tempName = ref('')

const handleItemRename = () => {
  // Request
  if ('summary' in props.item) {
    requestMutators.edit(props.item.uid, 'summary', tempName.value)
  }
  // Example
  else if ('requestUid' in props.item) {
    requestExampleMutators.edit(props.item.uid, 'name', tempName.value)
  }
  // Collection
  else if ('spec' in props.item) {
    collectionMutators.edit(props.item.uid, 'spec.info.title', tempName.value)
  }
  // Folder
  else {
    folderMutators.edit(props.item.uid, 'name', tempName.value)
  }

  renameModal.hide()
}

const renameModal = useModal()
const deleteModal = useModal()
const openRenameModal = () => {
  tempName.value = itemName.value
  renameModal.show()
}

/** Gets the title of the resource to use in the modal titles */
const resourceTitle = computed(() => {
  if ('requestUid' in props.item) return 'Example'
  if ('summary' in props.item) return 'Request'
  if ('spec' in props.item) return 'Collection'
  return 'Folder'
})
</script>

<template>
  <ScalarDropdown teleport="#scalar-client">
    <ScalarButton
      class="px-0.5 py-0 z-10 hover:bg-b-3 hidden group-hover:flex ui-open:flex absolute -translate-y-1/2 right-0 aspect-square inset-y-2/4 h-fit"
      size="sm"
      variant="ghost"
      @click="
        (ev) => {
          // We must stop propagation on folders and collections to prevent them from toggling
          if (resourceTitle === 'Collection' || resourceTitle === 'Folder')
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
        class="flex !gap-2"
        @click="handleAddExample">
        <ScalarIcon
          class="inline-flex"
          icon="Add"
          size="sm"
          thickness="1.5" />
        <span>Add Example</span>
      </ScalarDropdownItem>

      <!-- Rename -->
      <ScalarDropdownItem
        class="flex !gap-2"
        @click="openRenameModal">
        <ScalarIcon
          class="inline-flex"
          icon="Edit"
          size="sm"
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
        class="flex !gap-2"
        @click="deleteModal.show()">
        <ScalarIcon
          class="inline-flex"
          icon="Trash"
          size="sm"
          thickness="1.5" />
        <span>Delete</span>
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
  <ScalarModal
    :size="'sm'"
    :state="deleteModal"
    :title="`Delete ${resourceTitle}`">
    <DeleteSidebarListElement
      :variableName="itemName"
      warningMessage="Warning: Deleting this will delete all items inside of this"
      @close="deleteModal.hide()"
      @delete="handleItemDelete" />
  </ScalarModal>
  <ScalarModal
    :state="renameModal"
    :title="`Rename ${resourceTitle}`">
    <ScalarTextField
      v-model="tempName"
      :label="resourceTitle"
      labelShadowColor="var(--scalar-background-1)"
      @keydown.prevent.enter="handleItemRename" />
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
<style scoped>
.ellipsis-position {
  transform: translate3d(calc(-100% - 4.5px), 0, 0);
}
</style>
