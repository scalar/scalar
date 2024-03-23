import proxyServer from './proxy-worker'

// Just mocking this type since the express types don't seem to play nice with the
// cloudflare worker types
type Res = {
  setHeader: (key: string, val: string) => void
  write: (chunk: string) => void
  end: () => void
}

export const expressProxy = (req: Request, res: Res) => {
  proxyServer.fetch(req).then(({ body, headers }) =>
    body?.pipeTo(
      new WritableStream({
        start() {
          headers.forEach((v, n) => res.setHeader(n, v))
        },
        write(chunk) {
          res.write(chunk)
        },
        close() {
          res.end()
        },
      }) as WritableStream,
    ),
  )
}
