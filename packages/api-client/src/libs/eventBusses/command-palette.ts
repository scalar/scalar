import type { CommandNames } from '@/components/CommandPalette/TheCommandPalette.vue'
import { type EventBusKey, useEventBus } from '@vueuse/core'

const commandPaletteKey: EventBusKey<CommandNames | undefined> = Symbol()

/**
 * Event bus for controlling the Command Palette
 *
 * @param commandName - the command name you wish to execute, leave empty for the full palette
 */
export const commandPaletteBus = useEventBus(commandPaletteKey)
