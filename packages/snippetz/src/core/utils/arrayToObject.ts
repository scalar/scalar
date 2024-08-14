/** Helper function to map { name: 'foo', value: 'bar' } to { foo: 'bar' } */
export function arrayToObject(items: any) {
  return items.reduce((acc: any, item: any) => {
    acc[item.name] = item.value
    return acc
  }, {})
}
