import type { CommandNames } from '@/components/CommandPalette/TheCommandPalette.vue'
import { type EventBusKey, useEventBus } from '@vueuse/core'

export type CommandPaletteEvent = { commandName?: CommandNames }
const commandPaletteKey: EventBusKey<CommandPaletteEvent> = Symbol()

/**
 * Event bus for controlling the Command Palette
 *
 * @param commandName - the command name you wish to execute, leave empty for the full palette
 */
export const commandPaletteBus = useEventBus(commandPaletteKey)
