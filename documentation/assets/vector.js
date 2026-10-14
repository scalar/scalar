function initVector() {
  try {
    if (window.vector) {
      console.log('Vector snippet included more than once.')
      return
    }

    const vector = { q: [] }

    const methods = ['load', 'identify', 'on']

    const createQueuedMethod =
      (method) =>
      (...args) => {
        vector.q.push([method, args])
      }

    for (const method of methods) {
      vector[method] = createQueuedMethod(method)
    }

    window.vector = vector

    if (!vector.loaded) {
      const firstScript = document.getElementsByTagName('script')[0]
      const script = document.createElement('script')

      script.type = 'text/javascript'
      script.async = true
      script.src = 'https://cdn.vector.co/pixel.js'

      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else {
        document.head.appendChild(script)
      }

      vector.loaded = true
    }
  } catch (error) {
    console.error('Error loading Vector:', error)
  }
}

initVector()

if (window.vector) {
  window.vector.load('35f38258-8949-4041-a905-81ffb5a51704')
}
