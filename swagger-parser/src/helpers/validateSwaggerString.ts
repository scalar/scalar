import { parseSwaggerString } from './parseSwaggerString'

/**
 * Validate a Swagger string
 */
export const validateSwaggerString = async (value: any): Promise<any> => {
  return new Promise(async (resolve) => {
    try {
      await parseSwaggerString(value)

      resolve(true)
    } catch {
      resolve(false)
    }
  })
}
