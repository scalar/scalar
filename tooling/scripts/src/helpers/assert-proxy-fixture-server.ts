/** Refuse to reuse a normal proxy, which cannot serve private integration fixtures. */
export const assertProxyFixtureServer = async (port: number): Promise<void> => {
  const response = await fetch(`http://127.0.0.1:${port}/ping`, {
    signal: AbortSignal.timeout(1000),
    redirect: 'error',
  }).catch(() => null)
  const isFixture = response?.ok && response.headers.get('X-Scalar-Test-Fixture') === '1'
  await response?.body?.cancel()
  if (!isFixture) {
    throw new Error(
      `Port ${port} is occupied by a server that is not the proxy test harness. Stop it before running test-servers.`,
    )
  }
}
