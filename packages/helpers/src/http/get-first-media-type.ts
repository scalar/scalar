/** Select the first declared content entry, preserving its media-type parameters and value. */
export const getFirstMediaType = <T>(content: Record<string, T> | undefined): [string, T] | undefined =>
  Object.entries(content ?? {})[0]
