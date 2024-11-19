/**
 * Converts an array of name/value pairs into an object with those mappings
 *
 * @example
 * arrayToObject([{ name: 'foo', value: 'bar' }]) // => { foo: 'bar' }
 */
export function arrayToObject(items: any) {
  return items.reduce((acc: any, item: any) => {
    acc[item.name] = item.value
    return acc
  }, {})
}
