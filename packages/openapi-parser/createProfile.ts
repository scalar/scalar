import { openapi } from './src'

console.profile()

const specification = {
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '2.0.0',
  },
  paths: {},
}

await openapi().load(structuredClone(specification)).dereference().get()

console.profileEnd()
