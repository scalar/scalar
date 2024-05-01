/**
 * Simple throttle function to avoid package dependencies
 */
export const throttle = (callback: (...args: any) => void, limit: number) => {
  let wait = false

  return function (...args: unknown[]) {
    if (wait) return

    callback(...args)
    wait = true
    setTimeout(() => (wait = false), limit)
  }
}
