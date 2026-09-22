import type { SeedContext } from './build-seed-context'
import { runInSandbox } from './sandbox'

/**
 * Result of executing a seed handler.
 */
type SeedExecutionResult = {
  result: any
}

/**
 * Execute seed code inside the QuickJS sandbox.
 *
 * The seed code can only reach the `store` and `faker` bridges and the `seed`
 * helper, which persists generated items through the store. It cannot touch the
 * host runtime.
 */
export async function executeSeed(code: string, context: SeedContext): Promise<SeedExecutionResult> {
  const result = await runInSandbox({
    code,
    store: context.store,
    jsonGlobals: { schema: context.schema },
    includeSeed: true,
  })

  return { result }
}
