import { reactive } from 'vue'

import type { LoadingState } from './types'

/**
 * Creates a reactive loading state for the ScalarLoading component
 *
 * @returns The loading state
 */
export function useLoadingState() {
  return reactive<LoadingState>({
    isValid: false,
    isInvalid: false,
    isLoading: false,
    isActive: false,
    start() {
      this.isLoading = true
      this.isActive = true
      this.isInvalid = false
      this.isValid = false
    },
    validate(opts = {}) {
      const { duration = 1100, persist = false } = opts
      this.isLoading = false
      this.isInvalid = false
      this.isValid = true
      this.isActive = true
      const diff = persist ? duration : duration - 300
      // Allow chaining after animation
      return new Promise((res) =>
        persist ? setTimeout(() => res(), diff) : setTimeout(() => this.clear().then(() => res()), diff),
      )
    },
    invalidate(opts = {}) {
      const { duration = 1100, persist = false } = opts ?? {}
      this.isLoading = false
      this.isValid = false
      this.isInvalid = true
      this.isActive = true
      const diff = persist ? duration : duration - 300
      // Allow chaining after animation
      return new Promise((res) =>
        persist ? setTimeout(() => res(), diff) : setTimeout(() => this.clear().then(() => res()), diff),
      )
    },
    clear(opts = {}) {
      const { duration = 300 } = opts
      this.isValid = false
      this.isInvalid = false
      this.isLoading = false
      // Allow chaining after animation
      return new Promise((res) => {
        setTimeout(() => {
          this.isActive = false
          res()
        }, duration)
      })
    },
  })
}
