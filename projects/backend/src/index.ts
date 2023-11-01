import { SQLite } from '@hocuspocus/extension-sqlite'
import { Hocuspocus } from '@hocuspocus/server'

const server = new Hocuspocus({
  port: 1234,
  extensions: [new SQLite()],
})

server.listen()
