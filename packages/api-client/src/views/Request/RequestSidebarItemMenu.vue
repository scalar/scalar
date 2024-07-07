<script setup lang="ts">
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarTextField,
  useModal,
} from '@scalar/components'
import { ScalarModal } from '@scalar/components'
import type {
  Request,
  RequestExample,
} from '@scalar/oas-utils/entities/workspace/spec'
import { nanoid } from 'nanoid'
import { computed, ref } from 'vue'

const props = defineProps<{
  item: Request | RequestExample
  parentUid?: string
}>()
const { createExampleFromRequest, requestMutators, requestExampleMutators } =
  useWorkspace()

const tempName = ref('')

const addExample = () => {
  if (!('summary' in props.item)) return

  const example = createExampleFromRequest(props.item)

  requestMutators.edit(props.item.uid, 'childUids', [
    ...props.item.childUids,
    example.uid,
  ])

  // TOOD route to example?
}

const isRequest = computed(() => 'summary' in props.item)
const itemName = computed(() => {
  if ('summary' in props.item) return props.item.summary || ''
  if ('name' in props.item) return props.item.name || ''
  return ''
})

const handleItemRename = () => {
  // rename request
  if ('summary' in props.item && props.parentUid) {
    requestMutators.edit(props.item.uid, 'summary', tempName.value)
  } else if (!('summary' in props.item)) {
    // rename example
    requestExampleMutators.edit(props.item.uid, 'name', tempName.value)
  }

  tempName.value = ''
  renameModal.hide()
}

const handleItemDelete = () => {
  // delete request
  if ('summary' in props.item && props.parentUid) {
    requestMutators.delete(props.item, props.parentUid)
  } else if (!('summary' in props.item)) {
    // delete example
    requestExampleMutators.delete(props.item as RequestExample)
  }
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
        @click="addExample">
        <ScalarIcon
          class="text-c-2 inline-flex p-px"
          icon="Add"
          size="xs" />
        <span>Add Example</span>
        <ScalarHotkey
          class="absolute right-2 text-c-3"
          hotkey="1"
          @hotkeyPressed="addExample" />
      </ScalarDropdownItem>
      <ScalarDropdownItem
        class="flex !gap-2"
        @click="openRenameModal">
        <ScalarIcon
          class="text-c-2 inline-flex p-px"
          icon="Edit"
          size="xs" />
        <span>Rename</span>
        <ScalarHotkey
          class="absolute right-2 text-c-3"
          hotkey="2"
          @hotkeyPressed="openRenameModal" />
      </ScalarDropdownItem>
      <!-- <ScalarDropdownItem class="flex !gap-2">
        <ScalarIcon
          class="text-c-2 inline-flex p-px"
          icon="Duplicate"
          size="xs" />
        <span>Duplicate</span>
        <ScalarHotkey
          class="absolute right-2 text-c-3"
          hotkey="3"
          @hotkeyPressed="handleItemDuplicate" />
      </ScalarDropdownItem> -->
      <ScalarDropdownDivider />
      <ScalarDropdownItem
        class="flex !gap-2"
        @click="deleteModal.show()">
        <ScalarIcon
          class="text-c-2 inline-flex p-px"
          icon="Trash"
          size="xs" />
        <span>Delete</span>
        <ScalarHotkey
          class="absolute right-2 text-c-3"
          hotkey="4"
          @hotkeyPressed="deleteModal.show()" />
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
