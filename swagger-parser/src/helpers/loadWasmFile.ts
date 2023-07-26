import '../wasm-swagger-parser/dist/wasm_exec.js'

/**
 * Loads the WASM file and instantiates it.
 */
export const loadWasmFile = async () => {
  // No need to load the WASM file again.
  // @ts-ignore
  if (typeof formatJSON !== 'undefined') {
    return
  }

  return new Promise((resolve) => {
    // Instantiate the WebAssembly module.
    // @ts-ignore
    const go = new Go()

    // Download the WASM file and instantiate it.
    WebAssembly.instantiateStreaming(
      fetch('./src/wasm-swagger-parser/dist/json.wasm'),
      go.importObject,
    )
      .then((result) => {
        go.run(result.instance)
        resolve(result.instance)
      })
      .catch((error) => {
        console.error('[loadWasmFile] Failed to load WASM file.', error)
      })
  })
}
