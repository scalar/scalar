<script setup lang="ts">
import CommandPaletteWorkspace from '@/components/CommandPalette/CommandPaletteWorkspace.vue'
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { useRouter } from 'vue-router'

const { activeWorkspace, workspaces } = useWorkspace()
const { push } = useRouter()

const modal = useModal()

const updateSelected = (uid: string) => {
  if (uid === activeWorkspace.value.uid) return
  push(`/workspace/${uid}`)
}
</script>
<template>
  <div class="flex items-center text-sm w-[inherit]">
    <ScalarDropdown>
      <ScalarButton
        class="font-normal h-full justify-start line-clamp-1 py-1.5 px-1.5 text-c-1 hover:bg-b-2 w-fit"
        fullWidth
        variant="ghost">
        <div class="font-medium m-0 text-sm flex gap-1.5 items-center">
          <h2 class="line-clamp-1 text-left w-[calc(100%-10px)]">
            {{ activeWorkspace.name }}
          </h2>
          <ScalarIcon
            class="size-3"
            icon="ChevronDown"
            thickness="3" />
        </div>
      </ScalarButton>

      <!-- Workspace list -->
      <template #items>
        <ScalarDropdownItem
          v-for="(workspace, uid) in workspaces"
          :key="uid"
          class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden w-full"
          @click.stop="updateSelected(uid)">
          <div
            class="flex items-center justify-center rounded-full p-[3px] w-4 h-4 group-hover/item:shadow-border"
            :class="
              activeWorkspace.uid === uid
                ? 'bg-blue text-b-1'
                : 'text-transparent'
            ">
            <ScalarIcon
              class="size-2.5"
              icon="Checkmark"
              thickness="3.5" />
          </div>
          <span class="text-ellipsis overflow-hidden">{{
            workspace.name
          }}</span>
        </ScalarDropdownItem>
        <ScalarDropdownDivider />

        <!-- Add new workspace -->
        <ScalarDropdownItem
          class="flex items-center gap-1.5"
          @click="modal.show()">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              class="h-2.5"
              icon="Add"
              thickness="3" />
          </div>
          <span>New Workspace</span>
        </ScalarDropdownItem>
      </template>
    </ScalarDropdown>
  </div>
  <ScalarModal
    bodyClass="!m-0 !p-1"
    :size="'sm'"
    :state="modal"
    variant="form">
    <CommandPaletteWorkspace
      class="[&_textarea]:px-1.5"
      @close="modal.hide()" />
  </ScalarModal>
</template>
