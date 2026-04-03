import type { ApiClientModal } from '@scalar/api-client/v2/features/modal'

import {
  type ApiClientController,
  type ReactApiClientConfiguration,
  createApiClientController,
} from './create-api-client-controller'
import { createLazyApiClientModal } from './lazy-load'

export type ApiClientModalStoreState = {
  controller: ApiClientController | null
}

type Singleton = { apiClient: ApiClientModal; host: HTMLElement }

let state: ApiClientModalStoreState = { controller: null }
const listeners = new Set<() => void>()

let singleton: Singleton | null = null
let refCount = 0

let mutex: Promise<void> = Promise.resolve()
const runExclusive = (fn: () => void | Promise<void>): Promise<void> => {
  const next = mutex.then(() => fn())
  mutex = next.then(() => undefined).catch(() => undefined)
  return next
}

const emit = (): void => {
  for (const listener of listeners) {
    listener()
  }
}

const setController = (controller: ApiClientController | null): void => {
  state = { ...state, controller }
  emit()
}

const disposeSingleton = (): void => {
  if (!singleton) {
    return
  }
  singleton.apiClient.app.unmount()
  singleton = null
  setController(null)
}

const disposeIfHostDetached = (): void => {
  if (singleton && !singleton.host.isConnected) {
    disposeSingleton()
  }
}

export const invalidateIfModalHostLost = (): void => {
  void runExclusive(() => {
    disposeIfHostDetached()
  })
}

export const acquireApiClientModal = (host: HTMLElement, options: ReactApiClientConfiguration): Promise<void> =>
  runExclusive(async () => {
    refCount += 1
    disposeIfHostDetached()

    // One Vue app per store; first connected mount wins until teardown.
    if (singleton?.host.isConnected) {
      return
    }

    const { apiClient, workspaceStore } = await createLazyApiClientModal({ el: host, options })
    singleton = { apiClient, host }
    setController(createApiClientController(apiClient, workspaceStore))
  })

export const releaseApiClientModal = (): void => {
  void runExclusive(() => {
    refCount = Math.max(0, refCount - 1)
    if (refCount === 0) {
      disposeSingleton()
    }
  })
}

const serverSnapshot: ApiClientModalStoreState = { controller: null }

export const apiClientModalStore = {
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot: (): ApiClientModalStoreState => state,
  getServerSnapshot: (): ApiClientModalStoreState => serverSnapshot,
  acquireApiClientModal,
  releaseApiClientModal,
  invalidateIfModalHostLost,
}
