import { autoUpdate, flip, shift, useFloating } from '@floating-ui/vue'
import { computed, onScopeDispose, ref, unref, watch } from 'vue'

import { DEFAULT_DELAY, DEFAULT_OFFSET, ELEMENT_CLASS, ELEMENT_ID } from './constants'
import type { Timer, TooltipConfiguration } from './types'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/**
 * The delay timer for the tooltip
 *
 * If there's not a timer running it should be undefined
 */
const timer = ref<Timer>()

/**
 * A reference to the tooltip element
 *
 * If the hook hasn't been initialized it should be undefined
 */
const el = ref<HTMLElement>()

/**
 * The configuration for the active tooltip
 *
 * If no tooltip is active it should be undefined
 */
const config = ref<TooltipConfiguration>()

// ---------------------------------------------------------------------------
// Core watcher and floating UI setup
// ---------------------------------------------------------------------------

// Set up floating UI
const { floatingStyles, placement, update } = useFloating(
  computed(() => unref(config.value?.targetRef)),
  el,
  {
    placement: computed(() => unref(config.value?.placement)),
    whileElementsMounted: autoUpdate,
    middleware: computed(() => [flip(), shift()]),
  },
)

// Expose the resolved placement side (post-flip) so the CSS can apply the offset
// gap only on the side facing the target. We key off the side (the part before
// the '-') because that is where the tooltip sits relative to the target. The
// initial side is set synchronously when the tooltip is shown (see the config
// watcher below); this watcher keeps it in sync once Floating UI flips it.
watch(placement, (value) => {
  if (!el.value || !value) {
    return
  }
  el.value.dataset.side = value.split('-')[0]
})

// Update the tooltip element's positioning when Floating UI updates the styles
watch(floatingStyles, () => {
  if (!el.value) {
    return
  }

  el.value.style.position = floatingStyles.value.position
  el.value.style.top = floatingStyles.value.top
  el.value.style.left = floatingStyles.value.left
  el.value.style.transform = floatingStyles.value.transform ?? ''
  el.value.style.willChange = floatingStyles.value.willChange ?? ''
})

// Show or hide the tooltip when the config changes
watch(
  config,
  (opts) => {
    if (!el.value) {
      return
    }

    if (opts) {
      // Keep the element in the right host if the target moved into or out of a modal
      // dialog while the tooltip was already showing. Opening a tooltip is handled in
      // `showTooltip` before the config is assigned, so this only fires when `targetRef`
      // changes underneath an open tooltip, and it has to ask Floating UI for a fresh
      // position because a reparent is neither a scroll nor a resize.
      if (moveTooltipToHost(unref(opts.targetRef))) {
        update()
      }

      const contentTarget = unref(opts?.contentTarget) ?? 'textContent'

      // Update the tooltip content
      el.value[contentTarget] = unref(opts?.content) ?? ''

      // Show the tooltip
      const offset = unref(opts?.offset) ?? DEFAULT_OFFSET
      el.value.style.setProperty('--scalar-tooltip-offset', `${offset}px`)

      // Set the side the tooltip sits on so the offset gap is only applied to
      // the target-facing side. Floating UI defaults to 'bottom' when no
      // placement is provided; the placement watcher above refines this after
      // any flip.
      el.value.dataset.side = (unref(opts?.placement) ?? 'bottom').split('-')[0]

      el.value.style.setProperty('display', 'block')
    } else {
      // Clear the tooltip content
      el.value.innerHTML = ''

      // Hide the tooltip
      el.value.style.removeProperty('--scalar-tooltip-offset')
      el.value.style.setProperty('display', 'none')

      // Park the element back on the body. Left inside a dialog it would be removed from
      // the document when that dialog unmounts, taking the shared tooltip with it.
      moveTooltipToHost(undefined)
    }
  },
  { deep: true },
)

// ---------------------------------------------------------------------------
// Lifecycle Functions
// ---------------------------------------------------------------------------

/**
 * Initialize the tooltip element
 *
 * If the tooltip is already initialized it will be ignored
 */
function initializeTooltipElement(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    // Skip tooltip initialization during SSR
    return
  }

  if (el.value) {
    // Tooltip already initialized
    return
  }

  // See if the tooltip element already exists
  // (Sometimes this happens with HMR)
  const existingTooltipElement = document.getElementById(ELEMENT_ID)

  if (existingTooltipElement) {
    el.value = existingTooltipElement
  } else {
    // Create the tooltip element
    el.value = document.createElement('div')
    el.value.role = 'tooltip'
    el.value.id = ELEMENT_ID
    el.value.classList.add(ELEMENT_CLASS)
    el.value.classList.add('scalar-app')
    el.value.style.setProperty('display', 'none')
    el.value.addEventListener('mouseleave', hideTooltip)
    document.body.appendChild(el.value)
  }
}

/**
 * Cleanup and reset the tooltip element
 */
export function cleanupTooltipElement() {
  document.getElementById(ELEMENT_ID)?.remove()
  el.value = undefined
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Hide the tooltip
 *
 * If the mouse is moving between the tooltip and the target we don't hide the tooltip
 */
function hideTooltip(_e: Event) {
  if (!isMovingOffElements(_e)) {
    // Don't hide the tooltip if the mouse is moving between the tooltip and the target
    return
  }

  // Clear any existing timer
  clearTimer()

  // Hide the tooltip
  config.value = undefined
}

/**
 * Handle the escape key
 *
 * If the escape key is pressed we need to hide the tooltip
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tooltip_role#keyboard_interactions
 */
function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    hideTooltip(e)
  }
}

/**
 * Find the modal dialog containing an element, if there is one
 *
 * Only a dialog opened with `showModal()` is promoted to the browser's top layer, and
 * `:modal` matches exactly those. The `open` property is not a substitute: it is also
 * true for `dialog.show()`, which leaves the dialog in the normal flow where the
 * tooltip already paints correctly.
 */
function getModalDialog(target: Element | undefined | null): HTMLDialogElement | undefined {
  const dialog = target?.closest('dialog')

  if (!dialog) {
    return undefined
  }

  try {
    return dialog.matches(':modal') ? dialog : undefined
  } catch {
    // `:modal` reached Safari a couple of releases after `showModal()` did, and an
    // unknown pseudo-class throws. Treating it as "not modal" degrades to the old
    // behaviour for that one case instead of breaking every tooltip on the page.
    return undefined
  }
}

/**
 * Move the tooltip element into the host it needs to paint above
 *
 * Top layer content paints above the rest of the document whatever `z-index` anything
 * else carries, so the only way to sit above a modal dialog is to live inside it.
 * Everywhere else the tooltip belongs on the body.
 *
 * This doubles as a repair step: appending an element that is no longer in the document
 * puts it back, which covers a dialog being unmounted while the tooltip sat inside it.
 *
 * Returns whether the element actually moved.
 */
function moveTooltipToHost(target: Element | undefined | null): boolean {
  if (!el.value) {
    return false
  }

  const host = getModalDialog(target) ?? document.body

  if (el.value.parentElement === host) {
    return false
  }

  host.appendChild(el.value)

  return true
}

/** Clears the current timer */
function clearTimer() {
  if (timer.value) {
    clearTimeout(timer.value)
    timer.value = undefined
  }
}

/** Get all the parents of an element */
function getAllParents(el: Element): Element[] {
  const parents: Element[] = []
  let parent = el.parentElement
  while (parent) {
    parents.push(parent)
    parent = parent.parentElement
  }
  return parents
}

/** Check if mouse moved off the target but onto the tooltip */
function isMovingOffElements(e: Event): boolean {
  const target = unref(config.value?.targetRef)
  if (e instanceof MouseEvent && e.relatedTarget instanceof Element && target) {
    const relatedTargetParents = getAllParents(e.relatedTarget)
    return (
      e.relatedTarget.id !== ELEMENT_ID &&
      !relatedTargetParents.some((parent) => parent.id === ELEMENT_ID) &&
      e.relatedTarget !== target
    )
  }
  return true
}

// ---------------------------------------------------------------------------
// Tooltip Hook
// ---------------------------------------------------------------------------

/**
 * Create a tooltip
 *
 * If there isn't a tooltip element it will be created
 */
export function useTooltip(opts: TooltipConfiguration) {
  initializeTooltipElement()

  /**
   * Show the tooltip after the delay if configured
   */
  function showTooltipAfterDelay(_e: Event) {
    const delay = unref(opts.delay) ?? DEFAULT_DELAY
    clearTimer()

    // Show the tooltip after the delay
    if (delay > 0) {
      timer.value = setTimeout(() => showTooltip(_e), delay)
    } else {
      showTooltip(_e)
    }
  }

  /**
   * Show the tooltip
   */
  function showTooltip(_e: Event) {
    clearTimer()

    // Handle the escape key
    document.addEventListener('keydown', handleEscape, { once: true, capture: true })

    // Move the element before the config is assigned, not after. Floating UI watches the
    // target with `flush: 'sync'`, so it measures the position the instant the config
    // lands, and that measurement has to happen with the tooltip already in its final
    // parent or the first frame is positioned against the wrong offset parent.
    moveTooltipToHost(unref(opts.targetRef))

    // Show the tooltip
    config.value = opts
  }

  watch(
    () => unref(opts.targetRef),
    (newRef, oldRef) => {
      if (oldRef) {
        oldRef.removeEventListener('mouseenter', showTooltipAfterDelay)
        oldRef.removeEventListener('mouseleave', hideTooltip)
        oldRef.removeEventListener('focus', showTooltip)
        oldRef.removeEventListener('blur', hideTooltip)

        oldRef.removeAttribute('aria-describedby')
      }
      if (newRef) {
        newRef.addEventListener('mouseenter', showTooltipAfterDelay)
        newRef.addEventListener('mouseleave', hideTooltip)
        newRef.addEventListener('focus', showTooltip)
        newRef.addEventListener('blur', hideTooltip)

        newRef.setAttribute('aria-describedby', ELEMENT_ID)
      }
    },
    { immediate: true },
  )

  // Cleanup the tooltip when the component is unmounted
  onScopeDispose(() => {
    clearTimer()

    const target = unref(opts.targetRef)
    if (target) {
      target.removeEventListener('mouseenter', showTooltipAfterDelay)
      target.removeEventListener('mouseleave', hideTooltip)
      target.removeEventListener('focus', showTooltip)
      target.removeEventListener('blur', hideTooltip)
      target.removeAttribute('aria-describedby')
    }

    // If the tooltip is showing on this target hide it
    if (unref(config.value?.targetRef) === unref(opts.targetRef)) {
      config.value = undefined
    }
  })
}
