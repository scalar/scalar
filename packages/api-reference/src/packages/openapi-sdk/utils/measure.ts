/**
 * Measure the time it takes to execute a given function
 */
export async function measure<T = any>(
  key: string,
  callback: () => T | Promise<T>,
) {
  const start = performance.now()

  const result = await callback()

  const end = performance.now()

  console.info(`${key}: ${Math.round(end - start)} ms`)

  return result
}
