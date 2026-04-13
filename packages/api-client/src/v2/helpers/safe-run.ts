export const tryCatch = async <T>(fn: () => Promise<T> | T) => {
  try {
    return {
      ok: true,
      data: await fn(),
    } as const
  } catch (error) {
    console.error(error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } as const
  }
}
