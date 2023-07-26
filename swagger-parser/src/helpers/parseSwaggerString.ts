import { loadWasmFile } from './loadWasmFile'

/**
 * Parse a Swagger string into a SwaggerObject
 */
export const parseSwaggerString = async (value: any): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    // Load the WASM file.
    await loadWasmFile()

    // Make sure the input is a string.
    const input = typeof value === 'string' ? value : JSON.stringify(value)

    // Parse the input.
    // @ts-ignore
    const result = formatJSON(input)

    // Return the parsed result.
    if (typeof result === 'string') {
      resolve(JSON.parse(result))
      return
    }

    // Throw an error if the result is an error.
    if (result.error) {
      reject(result.error.trim())
      return
    }

    resolve(null)
    return
  })
}
