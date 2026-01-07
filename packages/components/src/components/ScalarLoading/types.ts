/**
 * Options for the validate and invalidate methods
 */
type LoadingCompletionOptions = {
  /**
   * The duration of to wait before clearing the loading state in milliseconds
   *
   * The promise will resolve after the duration has passed.
   *
   * @default the length of the completion animation and clearing animation
   */
  duration?: number
  /**
   * Whether to persist the loading state after the validation.
   *
   * If true, the loading state will not be cleared after the completion animation.
   *
   * @default false
   */
  persist?: boolean
}

/**
 * The loading state for the ScalarLoading component
 */
export type LoadingState = {
  /**
   * Set to true if the loading state completed successfully
   */
  isValid: boolean
  /**
   * Set to true if the loading state completed with an error
   */
  isInvalid: boolean
  /**
   * Set to true if the loading state is currently loading
   */
  isLoading: boolean
  /**
   * Set to true if the loading state is currently active
   *
   * This is what you want to use to conditionally render (e.g. v-if) the loading component.
   */
  isActive: boolean
  /**
   * Start the loading animation
   */
  start: () => void
  /**
   * Set the loading state to true and complete successfully
   */
  validate: (opts?: LoadingCompletionOptions) => Promise<void>
  /**
   * Set the loading state to true and complete with an error
   */
  invalidate: (opts?: LoadingCompletionOptions) => Promise<void>
  /**
   * Clear the loading state
   */
  clear: (opts?: Pick<LoadingCompletionOptions, 'duration'>) => Promise<void>
}
