<script setup lang="ts">
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const {
  environments,
  activeWorkspace,
  workspaceMutators,
  activeEnvironment,
  isReadOnly,
} = useWorkspace()

const router = useRouter()

const updateSelected = (uid: string) => {
  workspaceMutators.edit(activeWorkspace.value.uid, 'activeEnvironmentId', uid)
}

const createNewEnvironment = () =>
  router.push(`/workspace/${activeWorkspace.value.uid}/environment`)

const envs = computed(() => [
  // Always add the default environment
  environments['default'],
  ...Object.values(environments).filter((env) => env.uid !== 'default'),
])
</script>
<template>
  <div>
    <ScalarDropdown>
      <ScalarButton
        class="font-normal h-auto justify-start py-1.5 px-1.5 text-c-1 hover:bg-b-2 text-c-2 w-fit"
        fullWidth
        variant="ghost">
        <h2 class="font-medium m-0 text-sm flex gap-1.5 items-center">
          {{ activeEnvironment?.name ?? 'No Environment' }}
          <ScalarIcon
            class="size-2.5"
            icon="ChevronDown"
            thickness="3.5" />
        </h2>
      </ScalarButton>
      <!-- Workspace list -->
      <template #items>
        <ScalarDropdownItem
          class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden"
          @click.stop="updateSelected('')">
          <div
            class="flex items-center justify-center rounded-full p-[3px] w-4 h-4 group-hover/item:shadow-border"
            :class="
              activeWorkspace.activeEnvironmentId === ''
                ? 'bg-blue text-b-1'
                : 'text-transparent'
            ">
            <ScalarIcon
              class="size-2.5"
              icon="Checkmark"
              thickness="3.5" />
          </div>
          No Environment
        </ScalarDropdownItem>
        <ScalarDropdownItem
          v-for="env in envs"
          :key="env.uid"
          class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden"
          @click.stop="updateSelected(env.uid)">
          <div
            class="flex items-center justify-center rounded-full p-[3px] w-4 h-4 group-hover/item:shadow-border"
            :class="
              activeWorkspace.activeEnvironmentId === env.uid
                ? 'bg-blue text-b-1'
                : 'text-transparent'
            ">
            <ScalarIcon
              class="size-2.5"
              icon="Checkmark"
              thickness="3.5" />
          </div>
          {{ env.name }}
        </ScalarDropdownItem>
        <ScalarDropdownDivider />
        <!-- Add new environment -->
        <ScalarDropdownItem
          v-if="!isReadOnly"
          class="flex items-center gap-1.5"
          @click="createNewEnvironment">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              class="h-2.5"
              icon="Add" />
          </div>
          <span>Create new environment</span>
        </ScalarDropdownItem>
      </template>
    </ScalarDropdown>
  </div>
</template>
