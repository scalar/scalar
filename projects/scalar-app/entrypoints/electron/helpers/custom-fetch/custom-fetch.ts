import { createCustomFetch } from './create-custom-fetch'
import { createIpcTransport } from './create-ipc-transport'

/**
 * Perform a fetch request via the Electron main process (undici), bypassing
 * Chromium's network stack (no CORS, no cookie stripping, no proxy).
 *
 * The transport is resolved lazily so `window.api` does not need to exist at
 * module load time (relevant for test environments).
 */
export const customFetch = createCustomFetch(createIpcTransport())
