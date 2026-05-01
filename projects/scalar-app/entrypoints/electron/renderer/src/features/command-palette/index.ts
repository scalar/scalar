import {
  type CommandPaletteAction,
  baseClientActions,
  baseRoutes,
  useCommandPaletteState,
} from '@scalar/api-client/v2/features/app'
import { ScalarIconArrowSquareIn } from '@scalar/icons'
import { computed, watch } from 'vue'

import { useAuth } from '@/hooks/use-auth'

import CommandPaletteImport from './components/CommandPaletteImport.vue'

const { isLoggedIn } = useAuth()

// Action for importing an API from OpenAPI, Swagger, Postman, or cURL sources via the command palette
const importSourceAction: CommandPaletteAction = {
  id: 'import-from-openapi-swagger-postman-curl',
  name: 'Import from OpenAPI/Swagger/Postman/cURL',
  component: CommandPaletteImport,
  icon: ScalarIconArrowSquareIn,
}

/** Dynamic actions based on the login state */
const actions = computed(() => {
  const base: CommandPaletteAction[] = [
    // Replace the first action with the import source action
    // This is to support native file imports on desktop
    importSourceAction,
    ...baseClientActions.splice(1),
  ]

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
