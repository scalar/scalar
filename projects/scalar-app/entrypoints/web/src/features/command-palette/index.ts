import {
  type CommandPaletteAction,
  baseClientActions,
  baseRoutes,
  useCommandPaletteState,
} from '@scalar/api-client/v2/features/app'
import { computed, watch } from 'vue'

import { importRegistryAction } from '@/features/command-palette/registry-docs'
import { useAuth } from '@/hooks/use-auth'

const { isLoggedIn } = useAuth()

/** Dynamic actions based on the login state */
const actions = computed(() => {
  const base: CommandPaletteAction[] = [...baseClientActions]
  // If the user is logged in, add the import registry action
  if (isLoggedIn.value) {
    base.splice(1, 0, importRegistryAction)
  }

  return base
})

/** Initialize the commandPaletteState */
export const commandPaletteState = useCommandPaletteState(actions, baseRoutes)

/** When we detect an @ symbol we shortcut directly to the import registry action */
watch(
  () => commandPaletteState.filterQuery.value,
  () => {
    if (commandPaletteState.filterQuery.value === '@' && isLoggedIn.value) {
      commandPaletteState.open('import-registry-doc' as any, {
        inputValue: '@',
      })
    }
  },
)
