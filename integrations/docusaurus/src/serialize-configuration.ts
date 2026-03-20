const serializeConfigurationValue = (value: unknown): string => {
  if (value === undefined) {
    return 'undefined'
  }

  if (typeof value === 'function') {
    return value.toString()
  }

  if (Array.isArray(value)) {
    const entries = value.map((item) => serializeConfigurationValue(item))
    return `[${entries.join(', ')}]`
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => `${JSON.stringify(key)}: ${serializeConfigurationValue(item)}`)

    return `{\n${entries.map((entry) => `  ${entry}`).join(',\n')}\n}`
  }

  return JSON.stringify(value) ?? 'undefined'
}

export const serializeConfigurationModule = (configuration: unknown): string => {
  return `export default ${serializeConfigurationValue(configuration)}\n`
}
