import { type Config, type LoaderPlugin, type ResolveResult, bundleDocument } from './bundle'

/** A recoverable failure, reported at the authored reference before rewriting. */
export type ReferenceDiagnostic = {
  kind: 'unresolved-document' | 'missing-target'
  reference: string
  source: string
  pointer: string
}

/** A completed bundling attempt; incomplete documents retain unresolved references. */
export type BundleResult = {
  document: Awaited<ReturnType<typeof bundleDocument>>
  diagnostics: ReferenceDiagnostic[]
  complete: boolean
  pruning: 'disabled' | 'applied' | 'skipped'
}

/** Bundle once, report recoverable reference failures, and prune only after successful resolution.
 * Root loading and unexpected hook/bundling failures still reject the promise.
 * Cached loader results remain authored data and can safely be reused across calls.
 */
export const bundleWithDiagnostics = async (
  input: Parameters<typeof bundleDocument>[0],
  config: Config,
): Promise<BundleResult> => {
  const diagnostics: ReferenceDiagnostic[] = []
  const sources = config.cache ?? new Map<string, Promise<ResolveResult>>()
  const prepareSource = async (pending: Promise<ResolveResult>): Promise<ResolveResult> => {
    const result = await pending.catch((): ResolveResult => ({ ok: false }))
    return result.ok ? { ...result, data: structuredClone(result.data) } : result
  }
  const wrapLoader = (plugin: LoaderPlugin): LoaderPlugin => ({
    ...plugin,
    exec: async (uri): Promise<ResolveResult> => {
      if (!sources.has(uri)) {
        sources.set(
          uri,
          Promise.resolve()
            .then(() => plugin.exec(uri))
            .catch((): ResolveResult => ({ ok: false })),
        )
      }
      return await prepareSource(sources.get(uri)!)
    },
  })
  const document = await bundleDocument(
    input,
    {
      ...config,
      cache: new Map(
        [...sources]
          .filter(([uri]) => uri !== input && uri !== config.origin)
          .map(([uri, pending]) => [uri, prepareSource(pending)]),
      ),
      plugins: config.plugins.map((plugin) => (plugin.type === 'loader' ? wrapLoader(plugin) : plugin)),
    },
    diagnostics,
  )
  const complete = diagnostics.length === 0
  return { document, diagnostics, complete, pruning: !config.treeShake ? 'disabled' : complete ? 'applied' : 'skipped' }
}
