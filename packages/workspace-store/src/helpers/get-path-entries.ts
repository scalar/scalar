/** Returns Path Item entries without treating arbitrary Paths Object extensions as paths. */
export const getPathEntries = <T>(paths: Record<string, T> | undefined): [string, T][] =>
  Object.entries(paths ?? {}).filter(([key]) => !key.startsWith('x-'))
