function initVector() {
  try {
    if (window.vector) {
      console.log('Vector snippet included more than once.')
      return
    }

    var vector = { q: [] }

    var methods = ['load', 'identify', 'on']

    var createQueuedMethod = function (method) {
      return function () {
        var args = Array.prototype.slice.call(arguments)
        vector.q.push([method, args])
      }
    }

    for (var index = 0; index < methods.length; index++) {
      var method = methods[index]
      vector[method] = createQueuedMethod(method)
    }

    window.vector = vector

    if (!vector.loaded) {
      var firstScript = document.getElementsByTagName('script')[0]
      var script = document.createElement('script')

      script.type = 'text/javascript'
      script.async = true
      script.src = 'https://cdn.vector.co/pixel.js'

      if (firstScript && firstScript.parentNode) {
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
