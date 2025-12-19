import { replaceVariables } from '@scalar/helpers/regex/replace-variables'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { objectEntries } from '@vueuse/core'

export const getServerUrl = (server: ServerObject | null, environmentVariables: Record<string, string>) => {
  /** Extract the server variables default values*/
  const serverVariables = objectEntries(server?.variables ?? {}).reduce(
    (acc, [name, variable]) => {
      if (variable.default) {
        acc[name] = variable.default
      }
      return acc
    },
    {} as Record<string, string>,
  )

  return replaceVariables(server?.url ?? '', { ...environmentVariables, ...serverVariables })
}
