<script lang="ts">
import type { Collection } from '@scalar/oas-utils/entities/spec'

import { importCurlCommand } from '@/libs/importers/curl'
import { PathId } from '@/routes'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import CommandPaletteCollection from './CommandPaletteCollection.vue'
import CommandPaletteExample from './CommandPaletteExample.vue'
import CommandPaletteImport from './CommandPaletteImport.vue'
import CommandPaletteImportCurl from './CommandPaletteImportCurl.vue'
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
  'Import from OpenAPI/Swagger/Postman/cURL': CommandPaletteImport,
  'Create Request': '',
  'Create Workspace': CommandPaletteWorkspace,
  'Add Tag': CommandPaletteTag,
  'Add Server': CommandPaletteServer,
  'Create Collection': CommandPaletteCollection,
  'Add Example': CommandPaletteExample,
  'Import from cURL': CommandPaletteImportCurl,
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
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { ScalarIcon, useModal } from '@scalar/components'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { ROUTES } from '@/constants'
import type { HotKeyEvent } from '@/libs'

const modalState = useModal()
const router = useRouter()
const { activeWorkspace, activeWorkspaceCollections, activeCollection } =
  useActiveEntities()
const { events, requestMutators } = useWorkspace()

/** Available Commands for the Command Palette */
const availableCommands = [
  {
    label: '',
    commands: [
      {
        name: 'Import from OpenAPI/Swagger/Postman/cURL',
        icon: 'Import',
      },
      {
        name: 'Create Request',
        icon: 'ExternalLink',
      },
      {
        name: 'Create Collection',
        icon: 'Collection',
      },
      {
        name: 'Add Tag',
        icon: 'Folder',
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
        path: {
          name: 'environment.default',
          params: {
            [PathId.Workspace]: activeWorkspace?.value?.uid ?? 'default',
          },
          query: { openEnvironmentModal: 'true' },
        },
      },
      {
        name: 'Add Cookie',
        icon: 'Cookie',
        path: {
          name: 'cookies.default',
          params: {
            [PathId.Workspace]: activeWorkspace?.value?.uid ?? 'default',
          },
          query: { openCookieModal: 'true' },
        },
      },
    ],
  },
  {
    label: 'Pages',
    commands: ROUTES.map((route) => ({
      name: route.displayName,
      icon: route.icon,
      path: router.resolve({
        ...route.to,
        params: {
          [PathId.Workspace]: activeWorkspace?.value?.uid ?? 'default',
        },
      }).href,
    })),
  },
] as const

type Command = (typeof availableCommands)[number]['commands'][number]

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
  if ('path' in command) {
    router.push(command.path)
    closeHandler()
  } else if (command.name === 'Create Request') {
    const draftsCollection = activeWorkspaceCollections.value.find(
      (collection: Collection) => collection.info?.title === 'Drafts',
    )

    if (draftsCollection) {
      const newRequest = requestMutators.add({}, draftsCollection.uid)

      if (newRequest) {
        router.push({
          name: 'request',
          params: {
            workspace: activeWorkspace.value?.uid,
            request: newRequest.uid,
          },
        })

        closeHandler()

        nextTick(() => {
          events.hotKeys.emit({
            focusAddressBar: new KeyboardEvent('keydown', { key: 'l' }),
          })
        })
      }
    } else {
      closeHandler()
    }
  } else {
    activeCommand.value = command.name
  }
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

  nextTick(() => {
    const container = commandInputRef.value?.closest('.custom-scroll')
    if (!container) return

    // Scroll to the top if the first command is selected
    if (selectedSearchResult.value === 0) {
      container.scrollTop = 0
      return
    }

    // Scroll to the selected command
    const commandElement = commandRefs.value[selectedSearchResult.value]
    if (!commandElement) return

    // Set the height of the sticky header and the bottom margin
    const stickyHeaderHeight =
      (container.querySelector('.sticky')?.clientHeight || 0) + 16
    const bottomMargin = 6

    // Get the top and bottom of the command element
    const elementTop = commandElement.offsetTop
    const elementBottom = elementTop + commandElement.clientHeight

    // Get the top and bottom of the viewport
    const viewportTop = container.scrollTop + stickyHeaderHeight
    const viewportBottom =
      container.scrollTop + container.clientHeight - bottomMargin

    // Scroll to the command if it's not in the viewport
    if (elementTop < viewportTop) {
      container.scrollTop = elementTop - stickyHeaderHeight
    } else if (elementBottom > viewportBottom) {
      container.scrollTop =
        elementBottom - container.clientHeight + bottomMargin
    }
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

const handleInput = (value: string) => {
  if (value.trim().toLowerCase().startsWith('curl')) {
    events.commandPalette.emit({
      commandName: 'Import from cURL',
      metaData: {
        parsedCurl: importCurlCommand(value),
        collectionUid: activeCollection.value?.uid,
      },
    })
    return
  }
  commandQuery.value = value
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
            :value="commandQuery"
            @input="handleInput(($event.target as HTMLInputElement).value)"
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
            class="text-c-3 mt-2 mb-1 px-2 text-xs font-medium">
            {{ group.label }}
          </div>
          <div
            v-for="command in group.commands.filter((command) =>
              command.name.toLowerCase().includes(commandQuery.toLowerCase()),
            )"
            :key="command.name"
            :ref="
              (el) => {
                if (el) {
                  const index = searchResultsWithPlaceholderResults.findIndex(
                    (c) => c.name === command.name,
                  )
                  if (index !== -1) commandRefs[index] = el as HTMLElement
                }
              }
            "
            class="commandmenu-item hover:bg-b-2 flex cursor-pointer items-center rounded px-2 py-1.5 text-sm"
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
