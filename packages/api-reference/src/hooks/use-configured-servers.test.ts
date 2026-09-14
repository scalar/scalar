import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { generateClientMutators } from '@scalar/workspace-store/mutators'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, ref } from 'vue'

import { normalizeConfigurations } from '@/helpers/normalize-configurations'

import { useConfiguredServers } from './use-configured-servers'

const scopes: ReturnType<typeof effectScope>[] = []
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))

const server = (value = 'prod', url = 'https://{env}.example.com') => ({
  url,
  variables: { env: { default: value } },
})
const content = {
  openapi: '3.1.0',
  info: { title: 'Test', version: '1' },
  paths: {},
  servers: [server('original', 'https://{env}.other.example.com')],
}

const setup = async () => {
  const configurations = ref(normalizeConfigurations({ slug: 'test', content, servers: [server()] }))
  const sourceStore = createWorkspaceStore()
  const clientStore = createWorkspaceStore()
  await sourceStore.addDocument({ name: 'test', document: content })
  const scope = effectScope()
  scopes.push(scope)
  scope.run(() => useConfiguredServers({ configurations, sourceStore, clientStore }))
  await clientStore.addDocument({ name: 'test', document: content })
  const document = clientStore.workspace.documents.test
  if (!isOpenApiDocument(document)) {
    throw new Error('Expected an OpenAPI document')
  }
  const edit = () =>
    generateClientMutators(clientStore)
      .doc('test')
      .server.updateServerVariables({
        index: 0,
        key: 'env',
        value: 'staging',
        meta: { type: 'document' },
      })
  return { configurations, sourceStore, clientStore, document, edit }
}

describe('use-configured-servers', () => {
  it('edits configured servers without changing the configuration or source document', async () => {
    const { configurations, sourceStore, document, edit } = await setup()
    edit()
    expect(document.servers).toStrictEqual([server('staging')])
    expect(configurations.value.test?.config.servers).toStrictEqual([server()])
    const source = sourceStore.workspace.documents.test
    expect(isOpenApiDocument(source) && source.servers).toStrictEqual(content.servers)
  })

  it('keeps edits when an unrelated configuration value changes', async () => {
    const { configurations, document, edit } = await setup()
    edit()
    configurations.value.test!.config.hideModels = true
    configurations.value = { ...configurations.value }
    expect(document.servers).toStrictEqual([server('staging')])
  })

  it('applies in-place changes to configured defaults', async () => {
    const { configurations, document, edit } = await setup()
    edit()
    configurations.value.test!.config.servers![0]!.variables!.env!.default = 'dev'
    expect(document.servers).toStrictEqual([server('dev')])
  })

  it('restores document servers when the configuration override is removed', async () => {
    const { configurations, document, edit } = await setup()
    edit()
    configurations.value.test!.config.servers = undefined
    expect(document.servers).toStrictEqual(content.servers)
  })

  it('respects an empty configured server list', async () => {
    const { configurations, document } = await setup()
    configurations.value.test!.config.servers = []
    expect(document.servers).toStrictEqual([])
  })

  it('applies configured servers again when the client document is reloaded', async () => {
    const { clientStore } = await setup()
    await clientStore.addDocument({ name: 'test', document: { ...content, info: { title: 'Reloaded', version: '2' } } })
    const document = clientStore.workspace.documents.test
    expect(isOpenApiDocument(document) && document.servers).toStrictEqual([server()])
  })

  it('keeps server values separate across documents', async () => {
    const { configurations, clientStore, document, edit } = await setup()
    edit()
    configurations.value = {
      ...configurations.value,
      ...normalizeConfigurations({ slug: 'second', content, servers: [server('second')] }),
    }
    await clientStore.addDocument({ name: 'second', document: content })
    clientStore.update('x-scalar-active-document', 'second')
    const second = clientStore.workspace.documents.second
    expect(isOpenApiDocument(second) && second.servers).toStrictEqual([server('second')])
    clientStore.update('x-scalar-active-document', 'test')
    expect(document.servers).toStrictEqual([server('staging')])
  })
})
