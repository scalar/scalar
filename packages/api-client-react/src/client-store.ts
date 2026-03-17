type ModalClient = {
  app: {
    unmount: () => void
  }
}

// These are required for the vue bundler version
globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

/** Client state */
let state = {
  clientDict: {} as Record<string, ModalClient>,
}

/** Set of listener functions to be called when state changes */
const listeners = new Set<() => void>()

/** Subscribe to state changes */
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Get the current state at this moment in time */
const getSnapshot = () => state

/** Trigger all listeners */
const emit = () => listeners.forEach((listener) => listener())

/** Add a client to the client dict */
const addClient = (url: string, client: ModalClient) => {
  state = { ...state, clientDict: { ...state.clientDict, [url]: client } }
  emit()
}

/** Remove a client from the client dict */
const removeClient = (url: string) => {
  const { [url]: _, ...clientDict } = state.clientDict
  state = { ...state, clientDict }
  emit()
}

export const clientStore = {
  getSnapshot,
  subscribe,
  addClient,
  removeClient,
}
