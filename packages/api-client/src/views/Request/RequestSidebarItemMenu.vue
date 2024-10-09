<script setup lang="ts">
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import EditSidebarListCollection from '@/components/Sidebar/Actions/EditSidebarListCollection.vue'
import EditSidebarListElement from '@/components/Sidebar/Actions/EditSidebarListElement.vue'
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
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ menuItem: SidebarMenuItem }>()

const emit = defineEmits<{
  closeMenu: []
}>()

const { replace } = useRouter()
const { activeWorkspace, activeRouterParams, events } = useWorkspace()

const editModal = useModal()
const deleteModal = useModal()

/** Add example */
const handleAddExample = () =>
  events.commandPalette.emit({
    commandName: 'Add Example',
    metaData: {
      itemUid: props.menuItem.item?.entity.uid,
    },
  })

const handleEdit = (newName: string, newIcon?: string) => {
  props.menuItem.item?.edit(newName, newIcon)
  editModal.hide()
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

  deleteModal.hide()
}

// Manually focus the popup - not pretty but it works
const menuRef = ref<typeof ScalarDropdown | null>(null)
watch([() => props.menuItem.open, menuRef], async ([open]) => {
  if (open && menuRef.value?.$parent?.$el) menuRef.value.$parent.$el.focus()
})

// Close menu on click because headless doesn't seem to work
const globalClickListener = () => props.menuItem.open && emit('closeMenu')
onMounted(() => window.addEventListener('click', globalClickListener))
onBeforeUnmount(() => window.removeEventListener('click', globalClickListener))
</script>

<template>
  <ScalarDropdown
    v-if="menuItem.targetRef && menuItem.open"
    static
    :targetRef="menuItem.targetRef"
    teleport
    @keydown.escape="$emit('closeMenu')">
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
        ref="menuRef"
        class="flex gap-2"
        @click="editModal.show()">
        <ScalarIcon
          class="inline-flex"
          icon="Edit"
          size="md"
          thickness="1.5" />
        <span>
          <template v-if="menuItem.item?.entity.type === 'collection'">
            Edit
          </template>
          <template v-else> Rename </template>
        </span>
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
    :state="editModal"
    :title="`Edit ${menuItem.item?.resourceTitle}`">
    <EditSidebarListCollection
      v-if="menuItem.item?.resourceTitle === 'Collection'"
      :icon="menuItem.item?.icon || 'interface-content-folder'"
      :name="menuItem.item?.title"
      @close="editModal.hide()"
      @edit="handleEdit" />
    <EditSidebarListElement
      v-else
      :name="menuItem.item?.title ?? ''"
      @close="editModal.hide()"
      @edit="handleEdit" />
  </ScalarModal>
</template>
<style scoped>
.ellipsis-position {
  transform: translate3d(calc(-100% - 4.5px), 0, 0);
}
</style>
