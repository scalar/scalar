// TODO: This is a copy of org/packages/helpers/src/objects/merge.ts

/**
 * Overwrite a target object a new replacement object handling removed keys
 */
export const objectReplace = <A extends object, B extends object>(target: A, replacement: B) => {
  // Clear any keys that have been removed in the replacement
  Object.keys(target).forEach((key) => {
    if (!Object.hasOwn(replacement, key)) {
      delete target[key as keyof A]
    }
  })

  Object.assign(target, replacement)

  return target as unknown as B
}
