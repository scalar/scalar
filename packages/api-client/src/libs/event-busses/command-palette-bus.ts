import type { CommandNames } from '@/components/CommandPalette/TheCommandPalette.vue'
import { type EventBusKey, useEventBus } from '@vueuse/core'
import { ref } from 'vue'

export const isCommandPaletteOpen = ref(false)

export type CommandPaletteEvent = {
  /** The command name which matches with the command palette */
  commandName?: CommandNames
  /** Any extra metadata we want to pass to the command palettes */
  metaData?: string
}
const commandPaletteKey: EventBusKey<CommandPaletteEvent> = Symbol()

/**
 * Event bus for controlling the Command Palette
 *
 * @param commandName - the command name you wish to execute, leave empty for the full palette
 */
export const commandPaletteBus = useEventBus(commandPaletteKey)

commandPaletteBus.on((event) => {
  isCommandPaletteOpen.value = event ? !!event.commandName : false
})
