/** Match complete breadcrumb segments so `user` does not match `username`. */
export const isOnSchemaTargetPath = (path: string | undefined, target: string): boolean =>
  Boolean(path && target && (target === path || target.startsWith(`${path}.`)))
