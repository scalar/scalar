import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

import { getRaw } from '@scalar/json-magic/magic-proxy'

import { createWorkspaceStore } from '../dist/client.js'
import { createServerWorkspaceStore } from '../dist/server.js'

const fixture = (count, shape) => {
  const fanout = shape === 'shared'
  const propertiesHeavy = shape === 'properties'
  const schemas = Object.fromEntries(
    Array.from({ length: count }, (_, i) => [
      `Model${i}`,
      {
        type: 'object',
        description: propertiesHeavy
          ? `Model ${i}`
          : Array.from({ length: 64 }, (_, n) => `Field ${i * 64 + n} records an event and its delivery context.`).join(
              ' ',
            ),
        properties: {
          ...(propertiesHeavy
            ? Object.fromEntries(
                Array.from({ length: 64 }, (_, n) => [
                  `field${n}`,
                  { type: 'string', description: `Field ${i * 64 + n} records delivery context.` },
                ]),
              )
            : {}),
          id: { type: 'string' },
          next: { $ref: `#/components/schemas/Model${i}` },
        },
      },
    ]),
  )
  return {
    asyncapi: '3.0.0',
    info: { title: 'Benchmark', version: '1' },
    channels: Object.fromEntries(
      Array.from({ length: count }, (_, i) => [
        `channel${i}`,
        { address: `events/${i}`, messages: { event: { $ref: `#/components/messages/Message${i}` } } },
      ]),
    ),
    operations: Object.fromEntries(
      Array.from({ length: count }, (_, i) => [
        `operation${i}`,
        { action: 'receive', channel: { $ref: `#/channels/channel${i}` } },
      ]),
    ),
    components: {
      schemas,
      messages: Object.fromEntries(
        Array.from({ length: count }, (_, i) => [
          `Message${i}`,
          {
            payload: fanout
              ? { allOf: Object.keys(schemas).map((name) => ({ $ref: `#/components/schemas/${name}` })) }
              : { $ref: `#/components/schemas/Model${i}` },
          },
        ]),
      ),
    },
  }
}

const measure = async (count, shape, mode) => {
  const server = await createServerWorkspaceStore({
    mode: 'ssr',
    baseUrl: 'https://chunks.example.com',
    compact: true,
    documents: [{ name: 'events', document: fixture(count, shape) }],
  })
  const source = JSON.stringify(
    mode === 'whole' ? getRaw(server.getResolvedDocument('events')) : server.getWorkspace().documents.events,
  )
  await new Promise((resolve) => setImmediate(resolve))
  global.gc()
  const beforeHeap = process.memoryUsage().heapUsed
  let requests = 1
  let gzipBytes = gzipSync(source).length
  const client = createWorkspaceStore({
    fetch: (url) => {
      const body = JSON.stringify(server.get(new URL(String(url)).pathname))
      requests++
      gzipBytes += gzipSync(body).length
      return Promise.resolve(new Response(body, { headers: { 'Content-Type': 'application/json' } }))
    },
  })
  await client.addDocument({ name: 'events', document: JSON.parse(source) })
  client.update('x-scalar-active-document', 'events')
  if (mode === 'model') await client.resolve(['components', 'schemas', 'Model0'])
  if (mode === 'chunked') {
    await client.resolve(['x-scalar-navigation'])
    await client.resolve(['channels', 'channel0'])
    await client.resolve(['operations', 'operation0'])
  }
  await new Promise((resolve) => setImmediate(resolve))
  global.gc()
  const heapBytes = process.memoryUsage().heapUsed - beforeHeap
  const retainedBytes = Buffer.byteLength(JSON.stringify(getRaw(client.workspace.activeDocument)))
  return {
    gzipBytes,
    requests,
    heapBytes,
    retainedBytes,
    documentBytes: Buffer.byteLength(JSON.stringify(getRaw(server.getResolvedDocument('events')))),
  }
}

if (process.argv[2] === 'sample') {
  const mode = process.argv[5]
  await measure(16, 'properties', mode)
  await new Promise((resolve) => setImmediate(resolve))
  global.gc()
  const result = await measure(Number(process.argv[3]), process.argv[4], mode)
  process.stdout.write(JSON.stringify(result))
} else {
  const rows = []
  for (const shape of ['properties', 'strings', 'shared']) {
    for (const count of [64, 128, 256, 512]) {
      const sample = (mode) =>
        JSON.parse(
          execFileSync(
            process.execPath,
            ['--expose-gc', fileURLToPath(import.meta.url), 'sample', String(count), shape, mode],
            { encoding: 'utf8' },
          ),
        )
      rows.push({ count, shape, whole: sample('whole'), chunked: sample('chunked'), model: sample('model') })
    }
  }
  process.stdout.write(JSON.stringify(rows, null, 2) + '\n')
}
