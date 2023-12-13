import { availableTargets } from 'httpsnippet-lite'

export function getAvailableTargets() {
  const targets = availableTargets()

  return targets.map((target) => {
    // Node.js
    if (target.key === 'node') {
      target.default = 'undici'

      target.clients.unshift({
        description: 'An HTTP/1.1 client, written from scratch for Node.js.',
        key: 'undici',
        link: 'https://github.com/nodejs/undici',
        title: 'undici',
      })
    }

    // Remove clients
    target.clients = target.clients.filter((client) => {
      return !['fetch', 'unirest'].includes(client.key)
    })

    return target
  })
}
