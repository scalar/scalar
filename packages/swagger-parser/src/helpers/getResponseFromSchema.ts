import { getResponseFromProperties } from './getResponseFromProperties'

export const getResponseFromSchema = (schema: any): string => {
  return JSON.stringify(getResponseFromProperties(schema.properties))
}
