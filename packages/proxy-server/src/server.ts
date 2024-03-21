import proxyWorker from './proxy-worker'

export default {
  port: 5051,
  fetch: proxyWorker.fetch,
}
