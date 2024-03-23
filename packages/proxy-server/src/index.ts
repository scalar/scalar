import proxyServer from './proxy-worker'

export const proxyFetch = proxyServer.fetch
export { expressProxy } from './express'

export default proxyServer
