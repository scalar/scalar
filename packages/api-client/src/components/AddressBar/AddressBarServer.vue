<script setup lang="ts">
import { useWorkspace } from '@/store/workspace'
import {
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { computed } from 'vue'

defineProps<{
  workspace: any
}>()

const { activeCollection, servers, collectionMutators } = useWorkspace()

const serverOptions = computed(() =>
  activeCollection.value?.spec.serverUids?.map((serverUid: string) => ({
    id: serverUid,
    label: servers[serverUid].url,
  })),
)

/** Update the currently selected server on the collection */
const updateSelectedServer = (serverUid: string) => {
  if (!activeCollection.value) return

  collectionMutators.edit(
    activeCollection.value.uid,
    'selectedServerUid',
    serverUid,
  )
}

/** Set server checkbox in the dropdown */
const isSelectedServer = (serverId: string) => {
  return activeCollection.value?.selectedServerUid === serverId
}

/** Server URL with variables replaced */
const serverUrl = computed(() => {
  const server = servers[activeCollection.value?.selectedServerUid ?? '']
  const url = server?.url as string | undefined

  // TODO: use `replaceVariables` from `@scalar/oas-utils/helpers`
  // Note: Currently, it’s in @scalar/api-client, but that’s about to change.
  const singleCurlyBrackets = /{\s*([\w.-]+)\s*}/g

  return url?.replace(singleCurlyBrackets, (match, key) => {
    const variable = server?.variables?.[key]
    return variable?.value || variable?.default || variable?.enum?.[0] || match
  })
})
</script>
<template>
  <template v-if="serverOptions && !workspace.isReadOnly">
    <ScalarDropdown
      :options="serverOptions"
      resize
      teleport="#scalar-client"
      :value="activeCollection?.selectedServerUid">
      <button
        class="font-code lg:text-sm text-xs whitespace-nowrap border border-b-3 border-solid rounded px-1.5 text-c-2 z-[1]"
        type="button"
        @click.stop>
        {{ serverUrl }}
      </button>
      <template #items>
        <ScalarDropdownItem
          v-for="server in serverOptions"
          :key="server.id"
          class="flex !gap-1.5 group font-code text-xxs whitespace-nowrap text-ellipsis overflow-hidden"
          :value="server.id"
          @click="updateSelectedServer(server.id)">
          <div
            class="flex size-4 items-center justify-center rounded-full p-[3px] group-hover:shadow-border"
            :class="
              isSelectedServer(server.id)
                ? 'bg-blue text-b-1'
                : 'text-transparent'
            ">
            <ScalarIcon
              class="relative top-[0.5px] size-2.5 stroke-[1.75]"
              icon="Checkmark" />
          </div>
          <span class="whitespace-nowrap text-ellipsis overflow-hidden">
            {{ server.label }}
          </span>
        </ScalarDropdownItem>
        <template v-if="!workspace.isReadOnly">
          <ScalarDropdownDivider />
          <ScalarDropdownItem>
            <RouterLink
              class="font-code text-xxs flex items-center gap-1.5"
              to="/servers">
              <div class="flex items-center justify-center h-4 w-4">
                <ScalarIcon
                  class="h-2.5"
                  icon="Add" />
              </div>
              <span>Add Server</span>
            </RouterLink>
          </ScalarDropdownItem>
        </template>
      </template>
    </ScalarDropdown>
  </template>
  <template v-else>
    <div
      class="flex whitespace-nowrap items-center font-code lg:text-sm text-xs">
      {{ serverUrl }}
    </div>
  </template>
</template>
