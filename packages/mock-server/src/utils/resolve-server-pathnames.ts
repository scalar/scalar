import type { AsyncApiServerObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

/** Expand server pathname variables without expanding channel parameters or host variables. */
export const resolveServerPathnames = (server: AsyncApiServerObject): string[] => {
  const pathname = server.pathname ?? ''
  const names = [...new Set([...pathname.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]!))]
  return names.reduce<string[]>(
    (paths, name) => {
      const variable = getResolvedRef(server.variables?.[name])
      const values = variable?.enum?.length ? variable.enum : variable?.default !== undefined ? [variable.default] : []
      // Unconstrained variables remain dynamic route parameters.
      if (!values.length) return paths
      return [...new Set(paths.flatMap((path) => values.map((value) => path.replaceAll(`{${name}}`, () => value))))]
    },
    [pathname],
  )
}
