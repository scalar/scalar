/**
 * Wait for a condition to be met
 */
export const waitFor = async (checkFn: () => boolean, timeout = 4000, interval = 50): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const check = () => {
      if (checkFn()) {
        resolve()
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error('Condition not met within timeout period'))
      } else {
        setTimeout(check, interval)
      }
    }

    check()
  })
}
