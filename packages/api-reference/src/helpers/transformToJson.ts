import yaml from 'js-yaml'

/**
 * This helper is used to transform the content of the swagger file to JSON, even it was YAML.
 */
export const transformToJson = (value: string) => {
  try {
    // JSON
    JSON.parse(value)

    return value
  } catch {
    try {
      // Yaml to JSON
      const doc = yaml.load(value)
      return JSON.stringify(doc)
    } catch {
      // Invalid
      return value
    }
  }
}
