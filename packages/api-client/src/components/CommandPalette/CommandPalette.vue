<script setup lang="ts">
import { type Icon, type ModalState, ScalarIcon } from '@scalar/components'
import { useMagicKeys, whenever } from '@vueuse/core'
import { type Component, ref } from 'vue'
import { useRouter } from 'vue-router'

import CommandPaletteCollection from './CommandPaletteCollection.vue'
import CommandPaletteFolder from './CommandPaletteFolder.vue'
import CommandPaletteImport from './CommandPaletteImport.vue'
import CommandPaletteRequest from './CommandPaletteRequest.vue'
import CommandPaletteVariant from './CommandPaletteVariant.vue'

const props = defineProps<{
  state: ModalState
}>()

const router = useRouter()

type CommandNames =
  | 'Import Collection'
  | 'Create Request'
  | 'Add Folder'
  | 'Create Collection'
  | 'Add Example'
  | 'Add Server'
  | 'Add Environment'
  | 'Add Cookie'
  | ''

const PaletteComponents: Record<string, Component> = {
  'Import Collection': CommandPaletteImport,
  'Create Request': CommandPaletteRequest,
  'Add Folder': CommandPaletteFolder,
  'Create Collection': CommandPaletteCollection,
  'Add Example': CommandPaletteVariant,
}

type Command = {
  name: CommandNames
  icon: Icon
  overloadAction?: () => void
}

type Group = {
  label: string
  commands: Command[]
}

const availableCommands: Group[] = [
  {
    label: 'Add to Request Sidebar',
    commands: [
      {
        name: 'Create Request',
        icon: 'ExternalLink',
      },
      {
        name: 'Import Collection',
        icon: 'Import',
      },
      {
        name: 'Add Folder',
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
    ],
  },
  {
    label: 'More Actions',
    commands: [
      {
        name: 'Add Server',
        icon: 'Brackets',
        overloadAction: () => router.push('/servers'),
      },
      {
        name: 'Add Environment',
        icon: 'Server',
        overloadAction: () => router.push('/environment'),
      },
      {
        name: 'Add Cookie',
        icon: 'Cookie',
        overloadAction: () => router.push('/cookies'),
      },
    ],
  },
]

const keys = useMagicKeys()

const commandQuery = ref('')
const activeCommand = ref<CommandNames>('')

whenever(keys.escape, () => {
  if (props.state.open) props.state.hide()
})

function closeHandler() {
  props.state.hide()
  commandQuery.value = ''
  activeCommand.value = ''
}
</script>
<template>
  <div
    v-show="state.open"
    class="commandmenu-clickout"
    @click="state.hide()"></div>
  <div
    v-show="state.open"
    class="commandmenu">
    <template v-if="!activeCommand">
      <div
        class="bg-b-2 flex items-center rounded mb-2 pl-2 focus-within:bg-b-1 focus-within:shadow-border">
        <label for="commandmenu">
          <ScalarIcon
            class="text-c-1 mr-2.5 !stroke-1.5"
            icon="SearchNew"
            size="sm" />
        </label>
        <input
          id="commandmenu"
          v-model="commandQuery"
          class="w-full rounded bg-none border-none py-1.5 text-sm focus:outline-none"
          placeholder="Search commands..."
          type="text" />
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
          class="text-c-3 font-medium text-xs mt-2">
          {{ group.label }}
        </div>
        <div
          v-for="command in group.commands.filter((command) =>
            command.name.toLowerCase().includes(commandQuery.toLowerCase()),
          )"
          :key="command.name"
          class="commandmenu-item text-sm flex items-center py-1.5 px-2 rounded hover:bg-b-2 cursor-pointer"
          @click="
            command?.overloadAction?.() ?? (activeCommand = command.name)
          ">
          <ScalarIcon
            class="text-c-1 mr-2.5 !stroke-1.5"
            :icon="command.icon"
            size="md" />
          {{ command.name }}
        </div>
      </template>
    </template>
    <template v-else>
      <button
        class="absolute p-1 hover:bg-b-3 rounded text-c-3 active:text-c-1 m-1.5 z-10"
        type="button"
        @click="activeCommand = ''">
        <ScalarIcon
          class="!stroke-1.5"
          icon="ChevronLeft"
          size="sm" />
      </button>
      <component
        :is="PaletteComponents[activeCommand]"
        @close="closeHandler" />
    </template>
  </div>
</template>
<style scoped>
/* command menu */
.commandmenu {
  box-shadow: var(--scalar-shadow-2);
  border-radius: var(--scalar-radius-lg);
  background-color: var(--scalar-background-1);
  width: 100%;
  max-width: 580px;
  padding: 12px;
  margin: 12px;
  position: fixed;
  z-index: 10;
  left: 50%;
  top: 150px;
  opacity: 0;
  transform: translate3d(-50%, 10px, 0);
  z-index: 100;
  animation: fadeincommandmenu ease-in-out 0.3s forwards;
  animation-delay: 0.1s;
}
.commandmenu-clickout {
  background: rgba(0, 0, 0, 0.2);
  animation: fadeincommand ease-in-out 0.3s forwards;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
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
