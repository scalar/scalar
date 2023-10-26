/**
 * Takes JSON and formats it.
 **/
export const prettyPrintJson = (value: any) => {
  try {
    if (typeof value === 'string') {
      return JSON.stringify(JSON.parse(value), null, 2)
    } else {
      return JSON.stringify(value, null, 2)
    }
  } catch {
    console.log('[prettyPrintJson] Error parsing JSON', value)

    return value
  }
}
