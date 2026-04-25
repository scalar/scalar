import { watch } from 'vue'

type UsePathMaskingOptions = {
  /**
   * Watched for becoming truthy before any masking fires. Typically a getter
   * for the editor instance (e.g. the CodeMirror view) so we do not try to
   * mask before the input is ready to accept focus and content updates.
   */
  isReady: () => unknown
  /**
   * Key that changes whenever navigation switches to a different operation
   * or example. The masking re-runs every time this value changes.
   */
  operationKey: () => unknown
  /**
   * Predicate evaluated on every trigger. Returning `true` performs the mask.
   */
  shouldMask: () => boolean
  /**
   * Callback invoked when a mask should happen. Typically focuses the input
   * and clears its visible text.
   */
  onMask: () => void
}

/**
 * Masks placeholder paths in an editable input (e.g. the address bar).
 *
 * Fires on the initial ready state and on every `operationKey` change. The
 * consumer owns any content-aware guard needed before clearing visible text.
 */
export const usePathMasking = ({ isReady, operationKey, shouldMask, onMask }: UsePathMaskingOptions): void => {
  watch(
    [isReady, operationKey],
    ([ready]) => {
      if (!ready) {
        return
      }

      if (shouldMask()) {
        onMask()
      }
    },
    // `post` flush runs after child watchers sync `modelValue` into the
    // underlying input (e.g. CodeInput → CodeMirror); otherwise they would
    // overwrite the cleared content with the new path.
    { flush: 'post' },
  )
}
