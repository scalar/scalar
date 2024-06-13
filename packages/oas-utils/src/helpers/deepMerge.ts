const isObject = (item: unknown) => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Kind of type safe deep merge for objects
 *
 * TODO Fix types but works for now with the as unknown as keyof
 */
export const deepMerge = <T extends object, I extends object>(
  target: T,
  ...sources: I[]
): T => {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key as unknown as keyof T])
          Object.assign(target, { [key]: {} })
        deepMerge(
          target[key as unknown as keyof T] as object,
          source[key] as object,
        )
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }
  return deepMerge(target, ...sources)
}
