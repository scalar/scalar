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
 * Fires on the initial ready state and on every `operationKey` change — but
 * not on changes the user triggered locally. Consumers coordinate with the
 * hook via `beginLocalEdit` / `endLocalEdit` around their emit so that an
 * edit followed by a blur does not re-focus the input against the user's
 * intent.
 *
 * The pair is deterministic: the watcher consumes the flag synchronously
 * when the key actually changes, and `endLocalEdit(false)` clears it when
 * the change never propagated (conflict or no-change). No timers involved.
 */
export const usePathMasking = ({
  isReady,
  operationKey,
  shouldMask,
  onMask,
}: UsePathMaskingOptions): {
  /** Call before triggering a local path/method update. */
  beginLocalEdit: () => void
  /**
   * Pass `true` if the update mutated the operation (watcher consumes the
   * flag); `false` to clear it now.
   */
  endLocalEdit: (didApply: boolean) => void
} => {
  let isLocalEdit = false

  const beginLocalEdit = (): void => {
    isLocalEdit = true
  }

  const endLocalEdit = (didApply: boolean): void => {
    if (!didApply) {
      isLocalEdit = false
    }
  }

  watch(
    [isReady, operationKey],
    ([ready]) => {
      if (!ready) {
        return
      }

      if (isLocalEdit) {
        isLocalEdit = false
        return
      }

      // Defer to the next frame so focus() runs after click-handler side
      // effects that move focus (e.g. a dropdown refocusing its trigger),
      // which would otherwise blur our input and emit a spurious path
      // update against the now-empty value.
      if (shouldMask()) {
        requestAnimationFrame(() => onMask())
      }
    },
    // `post` flush runs after child watchers sync `modelValue` into the
    // underlying input (e.g. CodeInput → CodeMirror); otherwise they would
    // overwrite the cleared content with the new path.
    { flush: 'post' },
  )

  return { beginLocalEdit, endLocalEdit }
}
