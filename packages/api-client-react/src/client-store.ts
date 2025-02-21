import type { createApiClientModalSync as CreateApiClientModalSync } from '@scalar/api-client/layouts/Modal'

// These are required for the vue bundler version
globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

/** Client state */
let state = {
  createClient: null as typeof CreateApiClientModalSync | null,
  clientDict: {} as Record<string, ReturnType<typeof CreateApiClientModalSync>>,
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

/** Set the create client state */
const setCreateClient = (client: typeof CreateApiClientModalSync) => {
  state = { ...state, createClient: client }
  emit()
}

/** Add a client to the client dict */
const addClient = (url: string, client: ReturnType<typeof CreateApiClientModalSync>) => {
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
  setCreateClient,
  addClient,
  removeClient,
}
