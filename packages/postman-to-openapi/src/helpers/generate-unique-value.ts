export const generateUniqueValue = (defaultValue: string, validation: (value: string) => boolean, prefix = '') => {
  let i = 1
  let value = defaultValue
  while (!validation(value)) {
    value = `${defaultValue} ${prefix}${++i}`
  }
  return value
}
