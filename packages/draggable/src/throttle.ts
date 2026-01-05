/**
 * Simple throttle function to avoid package dependencies
 */
export const throttle = <TArgs extends Array<unknown>>(
  callback: (...args: TArgs) => void,
  limit: number,
): ((...args: TArgs) => void) => {
  let wait = false

  return (...args) => {
    if (wait) {
      return
    }

    callback(...args)
    wait = true
    setTimeout(() => (wait = false), limit)
  }
}
