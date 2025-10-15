import { expect } from 'vitest'

export const captureCustomEvent = <T>(el: HTMLElement, eventName: string) => {
  const state: {
    detail: T | null
  } = {
    detail: null,
  }

  el.addEventListener(eventName, (_event) => {
    state.detail = (_event as CustomEvent<T>).detail
  })

  return (detail: T) => expect.poll(() => state.detail, { timeout: 1000, interval: 100 }).toEqual(detail)
}
