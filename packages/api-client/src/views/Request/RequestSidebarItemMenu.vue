<script setup lang="ts">
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import RenameSidebarListElement from '@/components/Sidebar/Actions/RenameSidebarListElement.vue'
import { commandPaletteBus } from '@/libs/event-busses'
import { PathId } from '@/router'
import { useWorkspace } from '@/store'
import { requestSidebarMenuBus } from '@/views/Request/libs/event-busses'
import {
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const { replace } = useRouter()
const { activeWorkspace, activeRouterParams } = useWorkspace()

// @delete="deleteModal.show()"
// @rename="openRenameModal" />

const resource = ref(null)
const tempName = ref('')
const renameModal = useModal()
const deleteModal = useModal()

/** Add example */
const handleAddExample = () =>
  commandPaletteBus.emit({
    commandName: 'Add Example',
    metaData: {
      itemUid: props.item.uid,
    },
  })

const openRenameModal = () => {
  tempName.value = item.value.title || ''
  renameModal.show()
}

const handleItemRename = (newName: string) => {
  tempName.value = newName
  item.value.rename()
  renameModal.hide()
}

/** Delete with redirect for both requests and requestExamples */
const handleItemDelete = () => {
  item.value.delete()

  if (activeRouterParams.value[PathId.Request] === props.uid)
    replace(`/workspace/${activeWorkspace.value.uid}/request/default`)

  if (activeRouterParams.value[PathId.Examples] === props.uid)
    replace(`/workspace/${activeWorkspace.value}/request/default`)
}

// Listen for menu open events
requestSidebarMenuBus.on((ev) => (resource.value = ev))
</script>

<template>
  <ScalarDropdown
    v-if="resource"
    :targetRef="resource.targetRef"
    teleport>
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

  <!-- Modals -->
  <!-- <ScalarModal -->
  <!--   :size="'xxs'" -->
  <!--   :state="deleteModal" -->
  <!--   :title="`Delete ${item.resourceTitle}`"> -->
  <!--   <DeleteSidebarListElement -->
  <!--     :variableName="item.title" -->
  <!--     :warningMessage="item.warning" -->
  <!--     @close="deleteModal.hide()" -->
  <!--     @delete="handleItemDelete" /> -->
  <!-- </ScalarModal> -->
  <!-- <ScalarModal -->
  <!--   :size="'xxs'" -->
  <!--   :state="renameModal" -->
  <!--   :title="`Rename ${item.resourceTitle}`"> -->
  <!--   <RenameSidebarListElement -->
  <!--     :name="item.title" -->
  <!--     @close="renameModal.hide()" -->
  <!--     @rename="handleItemRename" /> -->
  <!-- </ScalarModal> -->
</template>
<style scoped>
.ellipsis-position {
  transform: translate3d(calc(-100% - 4.5px), 0, 0);
}
</style>
