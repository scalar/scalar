<script setup lang="ts">
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'

const { activeWorkspace, workspaces } = useWorkspace()

const updateSelected = (uid: string) => {
  if (uid === activeWorkspace.value.uid) return
  console.log('the new uid is: ', uid)
}

const createNewWorkspace = () => {
  console.log('creating new workspace')
}
</script>

<template>
  <div class="xl:min-h-header py-2.5 flex items-center border-b px-4 text-sm">
    <ScalarDropdown resize>
      <ScalarButton
        class="font-normal h-full justify-start py-1.5 px-0 text-c-1"
        fullWidth
        variant="ghost">
        <h2 class="font-medium m-0 text-sm">
          {{ activeWorkspace.name }}
        </h2>
      </ScalarButton>
      <template #items>
        <ScalarDropdownItem
          v-for="(workspace, uid) in workspaces"
          :key="uid"
          class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden"
          @click="updateSelected(uid)">
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
          {{ workspace.name }}
        </ScalarDropdownItem>
        <ScalarDropdownDivider />
        <ScalarDropdownItem
          class="flex items-center gap-1.5"
          @click="createNewWorkspace">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              class="h-2.5"
              icon="Add" />
          </div>
          <span>Create new workspace</span>
        </ScalarDropdownItem>
      </template>
    </ScalarDropdown>
  </div>
</template>
