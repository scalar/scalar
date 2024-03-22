import proxyServer from './proxy-worker'

export const proxyFetch = proxyServer.fetch
export default proxyServer
