<script lang="ts">
/**
 * The Command Palette Component
 *
 * A keyboard-driven command menu for quick access to common actions like:
 * - Creating documents, requests, tags, and examples
 * - Importing from OpenAPI, Swagger, Postman, or cURL
 * - Navigating to different routes
 *
 * Supports:
 * - Fuzzy search filtering
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Command grouping and organization
 * - Dynamic command components with props
 *
 * @example
 * <TheCommandPalette
 *   :paletteState="paletteState"
 *   :workspaceStore="workspaceStore"
 *   :eventBus="eventBus"
 * />
 */
export default {}
</script>

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
import CommandPaletteImportCurl from '@/v2/features/command-palette/components/CommandPaletteImportCurl.vue'
import CommandPaletteRequest from '@/v2/features/command-palette/components/CommandPaletteRequest.vue'
import CommandPaletteTag from '@/v2/features/command-palette/components/CommandPaletteTag.vue'
import type {
  Command,
  FolderCommandIds,
  OpenCommand,
  UiCommandIds,
  UseCommandPaletteStateReturn,
} from '@/v2/features/command-palette/hooks/use-command-palette-state'
import type { AssertAllValid } from '@/v2/features/command-palette/types'

const { paletteState, workspaceStore, eventBus } = defineProps<{
  /** The command palette state management hook */
  paletteState: UseCommandPaletteStateReturn
  /** The workspace store for accessing documents and operations */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting workspace events */
  eventBus: WorkspaceEventBus
}>()

/** Starting index when no search result is selected */
const NO_SELECTION_INDEX = -1

/** Map of command IDs to their corresponding Vue components */
const COMMAND_COMPONENTS = {
  'import-from-openapi-swagger-postman-curl': CommandPaletteImport,
  'create-document': CommandPaletteDocument,
  'create-request': CommandPaletteRequest,
  'add-tag': CommandPaletteTag,
  'add-example': CommandPaletteExample,
  'import-curl-command': CommandPaletteImportCurl,
} as const satisfies Record<UiCommandIds, Component>

/**
 * Type-level assertion: ensures all command components have correct props.
 * If any component is missing required props, this will cause a type error.
 */
const _assertCommandProps: AssertAllValid<typeof COMMAND_COMPONENTS> = 'valid'
void _assertCommandProps

const router = useRouter()

const selectedSearchResult = ref<number>(NO_SELECTION_INDEX)
const commandInputRef = ref<HTMLInputElement | null>(null)

/**
 * Flattens the filtered commands into a single array for keyboard navigation.
 * Makes it easier to track the selected index across all groups.
 */
const flattenedCommands = computed<Command[]>(() =>
  paletteState.filteredCommands.value.flatMap((group) => group.commands),
)

/** The currently selected command based on keyboard navigation */
const selectedCommand = computed<Command | undefined>(
  () => flattenedCommands.value[selectedSearchResult.value],
)

/**
 * Watch for search query changes and auto-select first result.
 * Resets selection when query is cleared.
 */
watch(
  () => paletteState.filterQuery.value,
  (newQuery: string) => {
    selectedSearchResult.value =
      newQuery && flattenedCommands.value.length > 0 ? 0 : NO_SELECTION_INDEX
  },
)

/**
 * Handle input changes in the search field.
 * Updates the filter query and redirects to cURL import if detected.
 */
const handleInput = (value: string): void => {
  paletteState.setFilterQuery(value)

  if (value.trim().toLowerCase().startsWith('curl')) {
    paletteState.open('import-curl-command', { curl: value })
  }
}

/**
 * Handle arrow key navigation in the command list.
 * Loops around to the beginning or end when reaching boundaries.
 */
const handleArrowKey = (
  direction: 'up' | 'down',
  event: KeyboardEvent,
): void => {
  if (!paletteState.isOpen.value) {
    return
  }
  event.preventDefault()

  const offset = direction === 'up' ? -1 : 1
  const length = flattenedCommands.value.length

  selectedSearchResult.value =
    (selectedSearchResult.value + offset + length) % length
}

/**
 * Handle enter key to execute the selected command.
 * Only works when a command is selected and no active command is open.
 */
const handleSelect = (event: KeyboardEvent): void => {
  if (!selectedCommand.value || paletteState.activeCommand.value) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  handleCommandClick(selectedCommand.value)
}

/**
 * Handle command selection (via click or enter key).
 * Routes to navigation commands or opens folder commands.
 */
const handleCommandClick = (command: Command): void => {
  /** Navigate to route commands and close palette */
  if (command.type === 'route') {
    router.push(command.to)
    closeHandler()
    return
  }

  /** Open folder commands to show sub-commands */
  if (command.type === 'folder') {
    // We are sure that the ids are of type FolderCommandIds because of the type assertion
    paletteState.open(command.id as FolderCommandIds, undefined)
  }
}

/**
 * Handle back navigation from active command.
 * Returns to the main command list and refocuses the search input.
 */
const handleBackEvent = (): void => {
  paletteState.reset()
  nextTick(() => commandInputRef.value?.focus())
}

/** Handle close event from active command components */
const handleCloseEvent = (): void => {
  paletteState.close()
}

/**
 * Handle opening a command with props from another command component.
 * Used for command-to-command transitions (e.g., cURL detection).
 */
const handleOpenCommand = (...args: Parameters<OpenCommand>) => {
  paletteState.open(...args)
}

/**
 * Close the command palette and reset state.
 * Resets search results and closes the dialog.
 */
const closeHandler = (): void => {
  paletteState.close()
  selectedSearchResult.value = NO_SELECTION_INDEX
}
</script>
<template>
  <Dialog
    :open="paletteState.isOpen.value"
    @close="closeHandler">
    <!-- Backdrop overlay -->
    <div class="commandmenu-overlay z-overlay" />

    <DialogPanel class="commandmenu z-overlay flex flex-col">
      <DialogTitle class="sr-only">API Client Command Menu</DialogTitle>

      <!-- Main command list view -->
      <div
        v-if="!paletteState.activeCommand.value"
        class="custom-scroll max-h-[50dvh] min-h-0 flex-1 rounded-lg p-1.5">
        <!-- Search input with icon -->
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

        <!-- Command groups and items -->
        <template
          v-for="group in paletteState.filteredCommands.value"
          :key="group.label">
          <!-- Group label -->
          <div
            v-show="group.commands.length > 0"
            class="text-c-3 mt-2 mb-1 px-2 text-xs font-medium">
            {{ group.label }}
          </div>

          <!-- Command items in the group -->

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
              v-if="'icon' in command"
              class="text-c-2 mr-2.5"
              :icon="command.icon"
              size="md"
              thickness="1.5" />
            {{ command.name }}
          </button>
        </template>

        <!-- Empty state when no commands match search -->
        <div
          v-if="!paletteState.filteredCommands.value.length"
          class="text-c-3 p-2 pt-3 text-center text-sm">
          No commands found
        </div>
      </div>

      <!-- Active command view (specific action form) -->
      <div
        v-else
        class="flex-1 p-1.5">
        <!-- Back button to return to command list -->
        <button
          class="hover:bg-b-3 text-c-3 active:text-c-1 absolute z-1 mt-[0.5px] rounded p-1.5"
          type="button"
          @click="handleBackEvent">
          <ScalarIcon
            icon="ChevronLeft"
            size="md"
            thickness="1.5" />
        </button>

        <!-- Dynamic command component -->
        <component
          :is="COMMAND_COMPONENTS[paletteState.activeCommand.value]"
          v-if="paletteState.activeCommand.value"
          v-bind="{
            workspaceStore,
            eventBus,
            ...paletteState.activeCommandProps.value,
          }"
          @back="handleBackEvent"
          @close="handleCloseEvent"
          @openCommand="handleOpenCommand" />
      </div>
    </DialogPanel>
  </Dialog>
</template>
<style scoped>
/**
 * Command Palette Styles
 * Centered dialog with fade-in animation and backdrop overlay
 */

/** Main command menu dialog */
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

/** Backdrop overlay with fade-in */
.commandmenu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  animation: fadeincommand ease-in-out 0.3s forwards;
  cursor: pointer;
}

/** Fade-in animation for overlay */
@keyframes fadeincommand {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/** Fade-in and slide-up animation for command menu */
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
