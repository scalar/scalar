import { getResponseFromProperties } from './getResponseFromProperties'

export const getResponseStringFromSchema = (schema: any): string => {
  return JSON.stringify(getResponseFromProperties(schema.properties))
}
