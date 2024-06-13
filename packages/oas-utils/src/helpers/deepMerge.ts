const isObject = (item: unknown) => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Kind of type safe deep merge for objects
 *
 * TODO switch to PartialDeep for better type safety
 */
export const deepMerge = <T extends object>(
  target: T,
  ...sources: Partial<T>[]
): T => {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key as keyof T]) Object.assign(target, { [key]: {} })
        deepMerge(target[key] as object, source[key] as object)
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }
  return deepMerge(target, ...sources)
}
