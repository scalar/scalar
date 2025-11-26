<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, nextTick, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'

import CommandPaletteDocument from '@/v2/features/command-palette/components/CommandPaletteDocument.vue'
import CommandPaletteExample from '@/v2/features/command-palette/components/CommandPaletteExample.vue'
import CommandPaletteImport from '@/v2/features/command-palette/components/CommandPaletteImport.vue'
import CommandPaletteRequest from '@/v2/features/command-palette/components/CommandPaletteRequest.vue'
import CommandPaletteTag from '@/v2/features/command-palette/components/CommandPaletteTag.vue'
import type {
  Command,
  FolderCommandIds,
  UseCommandPaletteStateReturn,
} from '@/v2/features/command-palette/hooks/use-command-palette-state'

const { paletteState } = defineProps<{
  paletteState: UseCommandPaletteStateReturn
  workspaceStore: WorkspaceStore
  eventBus: WorkspaceEventBus
}>()

const ComamandsComponents: Record<FolderCommandIds, Component> = {
  'import-from-openapi-swagger-postman-curl': CommandPaletteImport,
  'create-document': CommandPaletteDocument,
  'create-request': CommandPaletteRequest,
  'add-tag': CommandPaletteTag,
  'add-example': CommandPaletteExample,
}

const selectedSearchResult = ref<number>(-1)

/** Reset state on close */
const closeHandler = (): void => {
  paletteState.close()
  selectedSearchResult.value = -1
}

const commandInputRef = ref<HTMLInputElement | null>()

/**
 * Flattens the filtered commands into a single array for keyboard navigation.
 * This makes it easier to track the selected index across all groups.
 */
const flattenedCommands = computed(() => {
  return paletteState.filteredCommands.value.flatMap((group) => group.commands)
})

/** Focus on first result when conducting a search */
watch(
  () => paletteState.filterQuery.value,
  (newQuery) => {
    if (newQuery && flattenedCommands.value.length > 0) {
      selectedSearchResult.value = 0
    } else {
      selectedSearchResult.value = -1
    }
  },
)

/** Handle up and down arrow keys in the menu */
const handleArrowKey = (direction: 'up' | 'down', ev: KeyboardEvent): void => {
  if (!paletteState.isOpen.value) {
    return
  }
  ev.preventDefault()

  const offset = direction === 'up' ? -1 : 1
  const length = flattenedCommands.value.length

  // Ensures we loop around the array by using the remainder
  selectedSearchResult.value = (selectedSearchResult.value + offset) % length
}

/** The currently selected command */
const selectedCommand = computed(
  () => flattenedCommands.value[selectedSearchResult.value],
)

/** Handle enter keydown in the menu */
const handleSelect = (ev: KeyboardEvent): void => {
  if (!selectedCommand.value || paletteState.activeCommand.value) {
    return
  }
  ev.preventDefault()
  ev.stopPropagation()
  handleCommandClick(selectedCommand.value)
}

/** Handles input in the search field and updates the filter query. */
const handleInput = (value: string): void => {
  paletteState.setFilterQuery(value)

  // TODO: detect if the input is a cURL command and set the active command to the import from cURL command
}

const router = useRouter()

const handleCommandClick = (command: Command): void => {
  if (command.type === 'route') {
    router.push(command.to)
    closeHandler()
    return
  }

  // Set the active command to the folder
  if (command.type === 'folder') {
    paletteState.setActiveCommand(command.id as FolderCommandIds)
  }
}

const handleBackEvent = (): void => {
  paletteState.setActiveCommand(null)

  // Focus on the command input
  nextTick(() => commandInputRef.value?.focus())
}

const handleCloseEvent = (): void => {
  paletteState.close()
}
</script>
<template>
  <Dialog
    :open="paletteState.isOpen.value"
    @close="closeHandler">
    <div class="commandmenu-overlay z-overlay" />
    <DialogPanel class="commandmenu z-overlay flex flex-col">
      <DialogTitle class="sr-only">API Client Command Menu</DialogTitle>

      <!-- Default palette (command list) -->
      <div
        v-if="!paletteState.activeCommand.value"
        class="custom-scroll max-h-[50dvh] min-h-0 flex-1 rounded-lg p-1.5">
        <div
          class="bg-b-2 focus-within:bg-b-1 sticky top-0 flex items-center rounded-md border border-transparent pl-2 shadow-[0_-8px_0_8px_var(--scalar-background-1),0_0_8px_8px_var(--scalar-background-1)] focus-within:border-(--scalar-background-3)">
          <label for="commandmenu">
            <ScalarIcon
              class="text-c-2 mr-2.5"
              icon="Search"
              size="md"
              thickness="1.5" />
          </label>
          <input
            id="commandmenu"
            ref="commandInputRef"
            autocomplete="off"
            autofocus
            class="w-full rounded border-none bg-none py-1.5 text-sm focus:outline-none"
            placeholder="Search commands..."
            type="text"
            :value="paletteState.filterQuery.value"
            @input="handleInput(($event.target as HTMLInputElement).value)"
            @keydown.down.stop="handleArrowKey('down', $event)"
            @keydown.enter.stop="handleSelect"
            @keydown.up.stop="handleArrowKey('up', $event)" />
        </div>

        <template
          v-for="group in paletteState.filteredCommands.value"
          :key="group.label">
          <div
            v-show="group.commands.length > 0"
            class="text-c-3 mt-2 mb-1 px-2 text-xs font-medium">
            {{ group.label }}
          </div>
          <button
            v-for="command in group.commands"
            :id="command.id"
            :key="command.id"
            class="commandmenu-item hover:bg-b-2 flex w-full cursor-pointer items-center rounded px-2 py-1.5 text-left text-sm"
            :class="{
              'bg-b-2': command.id === selectedCommand?.id,
            }"
            type="button"
            @click="handleCommandClick(command)">
            <ScalarIcon
              class="text-c-2 mr-2.5"
              :icon="command.icon"
              size="md"
              thickness="1.5" />
            {{ command.name }}
          </button>
        </template>

        <div
          v-if="!paletteState.filteredCommands.value.length"
          class="text-c-3 p-2 pt-3 text-center text-sm">
          No commands found
        </div>
      </div>

      <!-- Specific command palette -->
      <div
        v-else
        class="flex-1 p-1.5">
        <button
          class="hover:bg-b-3 text-c-3 active:text-c-1 absolute z-1 mt-[0.5px] rounded p-1.5"
          type="button"
          @click="paletteState.setActiveCommand(null)">
          <ScalarIcon
            icon="ChevronLeft"
            size="md"
            thickness="1.5" />
        </button>
        <component
          :is="ComamandsComponents[paletteState.activeCommand.value]"
          v-if="paletteState.activeCommand.value"
          v-bind="{ workspaceStore, eventBus }"
          @back="handleBackEvent"
          @close="handleCloseEvent" />
      </div>
    </DialogPanel>
  </Dialog>
</template>
<style scoped>
/* command menu */
.commandmenu {
  box-shadow: var(--scalar-shadow-2);
  border-radius: var(--scalar-radius-lg);
  background-color: var(--scalar-background-1);
  max-height: 60dvh;
  width: 100%;
  max-width: 580px;
  margin: 12px;
  position: fixed;
  left: 50%;
  top: 150px;
  opacity: 0;
  transform: translate3d(-50%, 10px, 0);
  animation: fadeincommandmenu ease-in-out 0.3s forwards;
  animation-delay: 0.1s;
}
.commandmenu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  animation: fadeincommand ease-in-out 0.3s forwards;
  cursor: pointer;
}
@keyframes fadeincommand {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes fadeincommandmenu {
  0% {
    opacity: 0;
    transform: translate3d(-50%, 10px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(-50%, 0, 0);
  }
}
</style>
