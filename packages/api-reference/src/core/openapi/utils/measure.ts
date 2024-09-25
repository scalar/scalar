/**
 * Measure the time it takes to execute a given function
 */
export async function measure(
  key: string,
  callback: () => void | Promise<void>,
) {
  const start = performance.now()

  await callback()

  const end = performance.now()

  console.info(`${key}: ${Math.round(end - start)} ms`)
}
