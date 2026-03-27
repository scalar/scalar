function initApollo() {
  var n = Math.random().toString(36).substring(7),
    o = document.createElement('script')
  ;(o.src = 'https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=' + n),
    (o.async = !0),
    (o.defer = !0),
    (o.onload = () => {
      window.trackingFunctions.onLoad({ appId: '69af08315b42dc0021c4058a' })
    }),
    document.head.appendChild(o)
}
initApollo()
