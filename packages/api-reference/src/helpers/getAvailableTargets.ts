import { availableTargets } from 'httpsnippet-lite'

export function getAvailableTargets() {
  const targets = availableTargets()

  return targets.map((target) => {
    // Remove clients
    target.clients = target.clients.filter((client) => {
      return !['fetch', 'unirest'].includes(client.key)
    })

    // Node.js
    if (target.key === 'node') {
      target.default = 'undici'

      target.clients.unshift({
        description:
          'A browser-compatible implementation of the fetch() function.',
        key: 'fetch',
        link: 'https://nodejs.org/dist/latest/docs/api/globals.html#fetch',
        title: 'fetch',
      })

      target.clients.unshift({
        description: 'An HTTP/1.1 client, written from scratch for Node.js.',
        key: 'undici',
        link: 'https://github.com/nodejs/undici',
        title: 'undici',
      })
    }

    // JS
    if (target.key === 'javascript') {
      target.default = 'fetch'

      target.clients.unshift({
        description:
          'A browser-compatible implementation of the fetch() function.',
        key: 'fetch',
        link: 'https://nodejs.org/dist/latest/docs/api/globals.html#fetch',
        title: 'fetch',
      })
    }

    return target
  })
}
