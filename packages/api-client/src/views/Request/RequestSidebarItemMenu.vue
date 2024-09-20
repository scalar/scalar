<script setup lang="ts">
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import RenameSidebarListElement from '@/components/Sidebar/Actions/RenameSidebarListElement.vue'
import { commandPaletteBus } from '@/libs/event-busses'
import { PathId } from '@/router'
import { useWorkspace } from '@/store'
import type { SidebarMenuItem } from '@/views/Request/types'
import {
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ menuItem: SidebarMenuItem }>()

const emit = defineEmits<{
  closeMenu: []
}>()

const { replace } = useRouter()
const { activeWorkspace, activeRouterParams } = useWorkspace()

const tempName = ref('')
const renameModal = useModal()
const deleteModal = useModal()

/** Add example */
const handleAddExample = () =>
  commandPaletteBus.emit({
    commandName: 'Add Example',
    metaData: {
      itemUid: props.menuItem.item?.entity.uid,
    },
  })

const openRenameModal = () => {
  console.log('opening')
  tempName.value = props.menuItem.item?.title || ''
  renameModal.show()
}

const handleItemRename = (newName: string) => {
  tempName.value = newName
  props.menuItem.item?.rename(newName)
  renameModal.hide()
}

/** Delete with redirect for both requests and requestExamples */
const handleItemDelete = () => {
  props.menuItem.item?.delete()

  if (
    activeRouterParams.value[PathId.Request] === props.menuItem.item?.entity.uid
  )
    replace(`/workspace/${activeWorkspace.value.uid}/request/default`)

  if (
    activeRouterParams.value[PathId.Examples] ===
    props.menuItem.item?.entity.uid
  )
    replace(`/workspace/${activeWorkspace.value}/request/default`)
}

// Close menu on click becuse headless dont seem to work
const globalClickListener = () => emit('closeMenu')
onMounted(() => window.addEventListener('click', globalClickListener))
onBeforeUnmount(() => window.removeEventListener('click', globalClickListener))
</script>

<template>
  <ScalarDropdown
    v-if="menuItem.targetRef && menuItem.open"
    ref="ref"
    static
    :targetRef="menuItem.targetRef"
    teleport>
    <template #items>
      <!-- Add example -->
      <ScalarDropdownItem
        v-if="menuItem.item?.entity.type === 'request'"
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
        @click="openRenameModal">
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
        @click="deleteModal.show()">
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
  <ScalarModal
    :size="'xxs'"
    :state="deleteModal"
    :title="`Delete ${menuItem.item?.resourceTitle}`">
    <DeleteSidebarListElement
      :variableName="menuItem.item?.title ?? ''"
      :warningMessage="menuItem.item?.warning"
      @close="deleteModal.hide()"
      @delete="handleItemDelete" />
  </ScalarModal>
  <ScalarModal
    :size="'xxs'"
    :state="renameModal"
    :title="`Rename ${menuItem.item?.resourceTitle}`">
    <RenameSidebarListElement
      :name="menuItem.item?.title ?? ''"
      @close="renameModal.hide()"
      @rename="handleItemRename" />
  </ScalarModal>
</template>
<style scoped>
.ellipsis-position {
  transform: translate3d(calc(-100% - 4.5px), 0, 0);
}
</style>
