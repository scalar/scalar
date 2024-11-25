type NodeClient = 'undici' | 'fetch' | 'ofetch'
type JSClient = 'fetch' | 'ofetch'
type ShellClient = 'curl'

type TargetId = 'node' | 'js' | 'shell'

const getTarget = <
  TTarget extends TargetId,
  TClient extends TTarget extends 'node'
    ? NodeClient
    : TTarget extends 'js'
      ? JSClient
      : TTarget extends 'shell'
        ? ShellClient
        : never,
>(
  target: TTarget,
  client: TClient,
): { snippet: string } => {
  // do snippet things
  return {
    snippet: 'my-snippet',
  }
}

// Example usage - these will type-check correctly
const nodeTarget = getTarget('node', 'fetch')
const jsTarget = getTarget('js', 'fetch')
const shellTarget = getTarget('shell', 'curl')
