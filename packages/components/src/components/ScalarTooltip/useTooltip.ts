import type { Timer, TooltipConfiguration } from './types'
import { autoUpdate, flip, shift, useFloating } from '@floating-ui/vue'
import { computed, ref, unref, watch } from 'vue'
import { ELEMENT_ID, ELEMENT_CLASS, DEFAULT_DELAY, DEFAULT_OFFSET } from './constants'

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
const { floatingStyles } = useFloating(
  computed(() => unref(config.value?.targetRef)),
  el,
  {
    placement: computed(() => unref(config.value?.placement)),
    whileElementsMounted: autoUpdate,
    middleware: computed(() => [flip(), shift()]),
  },
)

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
      const contentTarget = unref(opts?.contentTarget) ?? 'textContent'

      // Update the tooltip content
      el.value[contentTarget] = unref(opts?.content) ?? ''

      // Show the tooltip
      const offset = unref(opts?.offset) ?? DEFAULT_OFFSET
      el.value.style.setProperty('--scalar-tooltip-offset', `${offset}px`)
      el.value.style.setProperty('display', 'block')
    } else {
      // Clear the tooltip content
      el.value.innerHTML = ''

      // Hide the tooltip
      el.value.style.removeProperty('--scalar-tooltip-offset')
      el.value.style.setProperty('display', 'none')
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
export function initializeTooltipElement() {
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
}
