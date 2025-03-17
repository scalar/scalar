type CallbackFunction = (...args: any[]) => any

/**
 * Dependency-less debounce function with max wait
 * derived from @url https://dev.to/cantem/how-to-write-a-debounce-function-1bdf
 *
 * @param fn - any function to debounce
 * @param wait - time in ms to wait after function call to invoke function
 * @param {number} maxWait - time in ms to wait after function call to invoke function even if it's still being called
 */
export function debounce<T extends CallbackFunction>(
  fn: T,
  wait: number,
  { maxWait }: { maxWait?: number } = {},
): (...args: any[]) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  let maxTimer: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: any[]) {
    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      maxTimer !== null ? clearTimeout(maxTimer) : null
      maxTimer = null
      fn.apply(this, args)
    }, wait)

    if (maxWait && !maxTimer) {
      maxTimer = setTimeout(() => {
        timer !== null ? clearTimeout(timer) : null
        maxTimer = null
        fn.apply(this, args)
      }, maxWait)
    }
  }
}
