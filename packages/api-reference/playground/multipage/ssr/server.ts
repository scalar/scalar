import express from 'express'
import { renderToString } from 'vue/server-renderer'

import { createApp } from '../src/ssr'

const server = express()

// server.get('/', (req, res) => {
//   renderToString(app).then((html) => {
//     res.send(`
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <title>Vue SSR Example</title>
//       </head>
//       <body>
//         <div id="app">${html}</div>
//       </body>
//     </html>
//     `)
//   })
// })

server.get('/', (req, res) => {
  // const context = { url: req.url }

  const app = createApp()

  renderToString(app).then((html) => {
    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Vue SSR Example</title>
      </head>
      <body>
        <div id="app">${html}</div>
        <script
          type="module"
          src="./playground/multipage/ssr/client.js"></script>
      </body>
    </html>
    `)
  })
})

server.use(express.static('.'))

server.listen(3000, () => {
  console.log('@scalar/api-reference SSR http://localhost:3000')
})
