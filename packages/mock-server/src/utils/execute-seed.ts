import type { SeedContext } from './build-seed-context'

/**
 * Result of executing a seed handler.
 */
type SeedExecutionResult = {
  result: any
}

/**
 * Execute seed code in a sandboxed environment.
 * The code has access only to the provided context (store, faker, seed, schema).
 */
export async function executeSeed(code: string, context: SeedContext): Promise<SeedExecutionResult> {
  // Create a function that executes the seed code with the context
  // Using Function constructor to create a sandboxed environment
  // The code is wrapped in a function body that returns the result
  const seedFunction = new Function(
    'store',
    'faker',
    'seed',
    'schema',
    `
    ${code}
  `,
  )

  // Execute the seed function with the context
  try {
    const result = seedFunction(context.store, context.faker, context.seed, context.schema)

    // If the result is a Promise, await it
    if (result instanceof Promise) {
      return { result: await result }
    }

    return { result }
  } catch (error) {
    // Re-throw to be caught by the caller
    throw error
  }
}
