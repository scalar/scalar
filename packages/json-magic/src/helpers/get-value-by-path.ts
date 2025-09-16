import { getId } from '@/helpers/get-schemas'

/**
 * Traverses an object using an array of string segments (path keys) and returns
 * the value at the specified path along with its context (id if available).
 *
 * @param target - The root object to traverse.
 * @param segments - An array of string keys representing the path to traverse.
 * @returns An object containing the final context (id or previous context) and the value at the path.
 *
 * @example
 * const obj = {
 *   foo: {
 *     bar: {
 *       baz: 42
 *     }
 *   }
 * };
 * // Returns: { context: '', value: 42 }
 * getValueByPath(obj, ['foo', 'bar', 'baz']);
 */
export function getValueByPath(target: Record<string, any>, segments: string[]): { context: string; value: any } {
  return segments.reduce<{ context: string; value: unknown }>(
    (acc, key) => {
      // If the accumulator is undefined, the path does not exist
      if (acc.value === undefined) {
        return { context: '', value: undefined }
      }
      // If the accumulator is not an object or is null, stop traversal
      if (typeof acc.value !== 'object' || acc.value === null) {
        return { context: '', value: undefined }
      }
      // Attempt to get the id from the current value for context tracking
      const id = getId(acc.value)

      // Return the next context and value for the next iteration
      return { context: id ?? acc.context, value: acc.value?.[key] }
    },
    {
      context: '',
      value: target,
    },
  )
}
