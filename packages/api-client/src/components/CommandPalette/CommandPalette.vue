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
  | 'Add Request'
  | 'Add Folder'
  | 'Add Collection'
  | 'Add Variant'
  | 'Add Server'
  | 'Add Environment'
  | 'Add Cookie'
  | ''

const PaletteComponents: Record<string, Component> = {
  'Import Collection': CommandPaletteImport,
  'Add Request': CommandPaletteRequest,
  'Add Folder': CommandPaletteFolder,
  'Add Collection': CommandPaletteCollection,
  'Add Variant': CommandPaletteVariant,
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
        name: 'Import Collection',
        icon: 'CodeFolder',
      },
      {
        name: 'Add Request',
        icon: 'ExternalLink',
      },
      {
        name: 'Add Folder',
        icon: 'CodeFolder',
      },
      {
        name: 'Add Collection',
        icon: 'CodeFolder',
      },
      {
        name: 'Add Variant',
        icon: 'ExternalLink',
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
    class="commandmenu">
    <template v-if="!activeCommand">
      <input
        v-model="commandQuery"
        class="w-full rounded bg-b-2 border-none py-1.5 px-2 mb-2 text-sm"
        placeholder="Search commands..."
        type="text" />
      <template
        v-for="group in availableCommands"
        :key="group.lavel">
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
        type="button"
        @click="activeCommand = ''">
        back
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
  border-radius: var(--scalar-radius);
  background-color: var(--scalar-background-1);
  width: 100%;
  max-width: 580px;
  padding: 12px;
  margin: 12px;
  position: fixed;
  z-index: 10;
  left: 50%;
  top: 50%;
  transform: translate3d(-50%, -50%, 0);
}
</style>
