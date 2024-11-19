<script setup lang="ts">
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarListboxCheckbox,
} from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const {
  activeCollection,
  activeWorkspace,
  activeEnvironment,
  setActiveEnvironment,
} = useActiveEntities()
const { isReadOnly } = useWorkspace()

const router = useRouter()

const updateSelected = (uid: string) => {
  setActiveEnvironment(uid)
}
const createNewEnvironment = () =>
  router.push({
    name: 'environment',
    params: {
      environment: activeWorkspace.value.uid,
    },
  })

const selectedEnvironment = computed(() => {
  if (!activeEnvironment.value) {
    return 'No Environment'
  }

  return activeEnvironment?.value?.uid === ''
    ? 'No Environment'
    : activeEnvironment?.value?.uid
})

const availableEnvironments = computed(() => {
  if (
    activeCollection.value?.['x-scalar-environments'] &&
    Object.keys(activeCollection.value['x-scalar-environments']).length > 0
  ) {
    return Object.entries(activeCollection.value['x-scalar-environments']).map(
      ([key, env]) => ({ ...env, uid: key, name: key }),
    )
  } else {
    return []
  }
})

const setInitialEnvironment = (collection: Collection) => {
  if (collection['x-scalar-environment']) {
    setActiveEnvironment(collection['x-scalar-environment'])
  } else if (
    collection['x-scalar-environments'] &&
    Object.keys(collection['x-scalar-environments']).length > 0
  ) {
    const firstEnvironment = Object.keys(collection['x-scalar-environments'])[0]
    setActiveEnvironment(firstEnvironment)
  } else {
    setActiveEnvironment('')
  }
}

watch(activeCollection, (newCollection) => {
  setInitialEnvironment(newCollection as Collection)
})

onMounted(() => {
  setInitialEnvironment(activeCollection.value as Collection)
})
</script>
<template>
  <div>
    <ScalarDropdown placement="bottom-end">
      <ScalarButton
        class="font-normal h-auto justify-start py-1.5 px-1.5 pl-2 text-c-1 hover:bg-b-2 text-c-1 w-fit"
        fullWidth
        variant="ghost">
        <h2 class="font-medium m-0 flex gap-1.5 items-center whitespace-nowrap">
          {{ selectedEnvironment }}
          <ScalarIcon
            icon="ChevronDown"
            size="md" />
        </h2>
      </ScalarButton>
      <!-- Workspace list -->
      <template #items>
        <ScalarDropdownItem
          v-for="environment in availableEnvironments"
          :key="environment.uid"
          class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden"
          @click.stop="updateSelected(environment.uid)">
          <ScalarListboxCheckbox
            :selected="
              activeWorkspace.activeEnvironmentId === environment.uid
            " />
          {{ environment.name }}
        </ScalarDropdownItem>
        <ScalarDropdownItem
          class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden"
          @click.stop="updateSelected('')">
          <div
            class="flex items-center justify-center rounded-full p-[3px] w-4 h-4"
            :class="
              activeEnvironment.uid === ''
                ? 'bg-c-accent text-b-1'
                : 'group-hover/item:shadow-border text-transparent'
            ">
            <ScalarIcon
              class="size-2.5"
              icon="Checkmark"
              thickness="3.5" />
          </div>
          No Environment
        </ScalarDropdownItem>
        <ScalarDropdownDivider />
        <!-- Manage environments -->
        <ScalarDropdownItem
          v-if="!isReadOnly"
          class="flex items-center gap-1.5"
          @click="createNewEnvironment">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              icon="Brackets"
              size="sm" />
          </div>
          <span class="leading-none">Manage Environments</span>
        </ScalarDropdownItem>
      </template>
    </ScalarDropdown>
  </div>
</template>
