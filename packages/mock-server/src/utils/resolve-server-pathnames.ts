import type { AsyncApiServerObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

import { expandServerVariables } from './expand-server-variables'

/** Expand server pathname variables without expanding channel parameters or host variables. */
export const resolveServerPathnames = (server: AsyncApiServerObject): string[] =>
  expandServerVariables(server.pathname ?? '', (name) => {
    const variable = getResolvedRef(server.variables?.[name])
    if (variable?.enum?.length) {
      return variable.enum
    }

    // Unconstrained variables remain dynamic route parameters.
    return variable?.default !== undefined ? [variable.default] : undefined
  })?.urls ?? []
