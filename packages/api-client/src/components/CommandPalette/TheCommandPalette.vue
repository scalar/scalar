<script lang="ts">
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import CommandPaletteCollection from './CommandPaletteCollection.vue'
import CommandPaletteExample from './CommandPaletteExample.vue'
import CommandPaletteImport from './CommandPaletteImport.vue'
import CommandPaletteRequest from './CommandPaletteRequest.vue'
import CommandPaletteServer from './CommandPaletteServer.vue'
import CommandPaletteTag from './CommandPaletteTag.vue'
import CommandPaletteWorkspace from './CommandPaletteWorkspace.vue'

/**
 * The Command Palette
 *
 * This component is a singleton so should only exist in our app once we will use the event bus to trigger it
 */
export default {
  name: 'TheCommandPalette',
}

export const PaletteComponents = {
  'Import from OpenAPI/Swagger/Postman': CommandPaletteImport,
  'Create Request': CommandPaletteRequest,
  'Create Workspace': CommandPaletteWorkspace,
  'Add Tag': CommandPaletteTag,
  'Add Server': CommandPaletteServer,
  'Create Collection': CommandPaletteCollection,
  'Add Example': CommandPaletteExample,
} as const

/** Infer the types from the commands  */
export type CommandNames = keyof typeof PaletteComponents

export type CommandPaletteEvent = {
  /** The command name which matches with the command palette */
  commandName?: CommandNames
  /** Any extra metadata we want to pass to the command palettes */
  metaData?: Record<string, any>
}
</script>

<script setup lang="ts">
import { ScalarIcon, useModal } from '@scalar/components'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants' // Import the ROUTES

import type { HotKeyEvent } from '@/libs'

/** Available Commands for the Command Palette */
const availableCommands = [
  {
    label: '',
    commands: [
      {
        name: 'Create Request',
        icon: 'ExternalLink',
      },
      {
        name: 'Import from OpenAPI/Swagger/Postman',
        icon: 'Import',
      },
      {
        name: 'Add Tag',
        icon: 'Folder',
      },
      {
        name: 'Create Collection',
        icon: 'Collection',
      },
      {
        name: 'Add Example',
        icon: 'Example',
      },
      {
        name: 'Add Server',
        icon: 'Server',
      },
    ],
  },
  {
    label: 'More Actions',
    commands: [
      {
        name: 'Create Workspace',
        icon: 'Workspace',
      },
      {
        name: 'Add Environment',
        icon: 'Brackets',
        path: 'environment.default',
      },
      {
        name: 'Add Cookie',
        icon: 'Cookie',
        path: 'cookies.default',
      },
    ],
  },
  {
    label: 'Pages',
    commands: ROUTES.map((route) => ({
      name: route.prettyName,
      icon: route.icon,
      path: `${route.name}.default`,
    })),
  },
] as const
type Command = (typeof availableCommands)[number]['commands'][number]

const modalState = useModal()
const { push } = useRouter()
const { activeWorkspace } = useActiveEntities()
const { events } = useWorkspace()

/** Additional metadata for the command palettes */
const metaData = ref<Record<string, any> | undefined>()
const commandQuery = ref('')
const activeCommand = ref<keyof typeof PaletteComponents | null>(null)
const selectedSearchResult = ref<number>(-1)
const commandRefs = ref<HTMLElement[]>([])

const searchResultsWithPlaceholderResults = computed(() =>
  availableCommands.reduce((acc, group) => {
    const filteredGroupCommands = group.commands.filter((command) =>
      command.name.toLowerCase().includes(commandQuery.value.toLowerCase()),
    )
    return [...acc, ...filteredGroupCommands]
  }, [] as Command[]),
)

/** Reset state on close */
const closeHandler = () => {
  modalState.hide()
  commandQuery.value = ''
  activeCommand.value = null
  selectedSearchResult.value = -1
}

/** Reset state on back */
const backHandler = (event: KeyboardEvent) => {
  // Prevent delete event from removing query command character
  if (commandQuery.value !== '') {
    event?.preventDefault()
  }
  activeCommand.value = null
  nextTick(() => commandInputRef.value?.focus())
}

/** Handle execution of the command, some have routes while others show another palette */
const executeCommand = (
  command: (typeof availableCommands)[number]['commands'][number],
) => {
  // Route to the page
  if ('path' in command) {
    push({
      name: command.path,
      params: {
        workspace: activeWorkspace.value?.uid,
      },
    })

    closeHandler()
  }

  // Open respective command palette
  else activeCommand.value = command.name
}

const commandInputRef = ref<HTMLInputElement | null>()

/** Handles opening the command pallete to the correct palette */
const openCommandPalette = ({
  commandName,
  metaData: _metaData,
}: CommandPaletteEvent = {}) => {
  activeCommand.value = commandName ?? null
  metaData.value = _metaData
  modalState.show()

  // Need nextTick to focus after a click since focus goes to the button
  nextTick(() => commandInputRef.value?.focus())
}

/** Focus on first result when conducting a search */
watch(commandQuery, (newQuery) => {
  if (newQuery && searchResultsWithPlaceholderResults.value.length > 0) {
    selectedSearchResult.value = 0
  }
})

/** Handle up and down arrow keys in the menu */
const handleArrowKey = (direction: 'up' | 'down', ev: KeyboardEvent) => {
  if (!modalState.open) return
  ev.preventDefault()

  const offset = direction === 'up' ? -1 : 1
  const length = searchResultsWithPlaceholderResults.value.length

  // Ensures we loop around the array by using the remainder
  selectedSearchResult.value =
    (selectedSearchResult.value + offset + length) % length

  commandRefs.value[selectedSearchResult.value]?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  })
}

/** The currently selected command */
const selectedCommand = computed(
  () => searchResultsWithPlaceholderResults.value[selectedSearchResult.value],
)

/** Handle enter keydown in the menu */
const handleSelect = (ev: KeyboardEvent) => {
  if (!selectedCommand.value || activeCommand.value) return
  ev.preventDefault()
  ev.stopPropagation()
  executeCommand(selectedCommand.value)
}

/** Handle hotkeys */
const handleHotKey = (event?: HotKeyEvent) => {
  if (!modalState.open) return
  if (event?.closeModal) closeHandler()
}

onMounted(() => {
  events.commandPalette.on(openCommandPalette)
  events.hotKeys.on(handleHotKey)
})
onBeforeUnmount(() => {
  events.commandPalette.off(openCommandPalette)
  events.hotKeys.off(handleHotKey)
})
</script>
<template>
  <Dialog
    :open="modalState.open"
    @close="closeHandler()">
    <div class="commandmenu-overlay z-overlay" />
    <DialogPanel class="commandmenu z-overlay flex flex-col">
      <DialogTitle class="sr-only">API Client Command Menu</DialogTitle>
      <!-- Default palette (command list) -->
      <div
        v-if="!activeCommand"
        class="flex-1 min-h-0 max-h-[50dvh] p-1.5 custom-scroll rounded-lg">
        <div
          class="bg-b-2 border border-transparent flex items-center rounded-md sticky top-0 pl-2 shadow-[0_-8px_0_8px_var(--scalar-background-1),0_0_8px_8px_var(--scalar-background-1)] focus-within:bg-b-1 focus-within:border-b-3">
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
            v-model="commandQuery"
            autocomplete="off"
            autofocus
            class="w-full rounded bg-none border-none py-1.5 text-sm focus:outline-none"
            placeholder="Search commands..."
            type="text"
            @keydown.down.stop="handleArrowKey('down', $event)"
            @keydown.enter.stop="handleSelect"
            @keydown.up.stop="handleArrowKey('up', $event)" />
        </div>
        <template
          v-for="group in availableCommands"
          :key="group.label">
          <div
            v-show="
              group.commands.filter((command) =>
                command.name.toLowerCase().includes(commandQuery.toLowerCase()),
              ).length > 0
            "
            class="text-c-3 font-medium text-xs px-2 mb-1 mt-2">
            {{ group.label }}
          </div>
          <div
            v-for="(command, index) in group.commands.filter((command) =>
              command.name.toLowerCase().includes(commandQuery.toLowerCase()),
            )"
            :key="command.name"
            :ref="
              (el) => {
                if (el) commandRefs[index] = el as HTMLElement
              }
            "
            class="commandmenu-item text-sm flex items-center py-1.5 px-2 rounded hover:bg-b-2 cursor-pointer"
            :class="{
              'bg-b-2': command.name === selectedCommand?.name,
            }"
            @click="executeCommand(command)">
            <ScalarIcon
              class="text-c-2 mr-2.5"
              :icon="command.icon"
              size="md"
              thickness="1.5" />
            {{ command.name }}
          </div>
        </template>
        <div
          v-if="!searchResultsWithPlaceholderResults.length"
          class="text-c-3 text-center text-sm p-2 pt-3">
          No commands found
        </div>
      </div>
      <!-- Specific command palette -->
      <div
        v-else
        class="flex-1 p-1.5">
        <button
          class="absolute p-0.75 hover:bg-b-3 rounded text-c-3 active:text-c-1 mr-1.5 my-1.25 z-1"
          type="button"
          @click="activeCommand = null">
          <ScalarIcon
            icon="ChevronLeft"
            size="md"
            thickness="1.5" />
        </button>
        <component
          :is="PaletteComponents[activeCommand]"
          v-bind="metaData ? { metaData: metaData } : {}"
          @back="backHandler($event)"
          @close="closeHandler" />
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
