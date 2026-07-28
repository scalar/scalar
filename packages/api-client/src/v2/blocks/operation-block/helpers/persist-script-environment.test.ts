import type { XScalarEnvVar } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { describe, expect, it } from 'vitest'

import { getEnvironmentPersistenceActions } from './persist-script-environment'

const variable = (name: string, value: string): XScalarEnvVar => ({ name, value })

describe('getEnvironmentPersistenceActions', () => {
  it('returns no actions when nothing changed', () => {
    const actions = getEnvironmentPersistenceActions({
      environmentName: 'default',
      seededVariables: { token: 'abc' },
      scriptVariables: [{ key: 'token', value: 'abc' }],
      mergedVariables: [variable('token', 'abc')],
      documentVariables: [],
      environmentExistsOnDocument: false,
    })

    expect(actions).toEqual([])
  })

  it('updates an existing workspace variable in place by index', () => {
    const actions = getEnvironmentPersistenceActions({
      environmentName: 'default',
      seededVariables: { token: 'old' },
      scriptVariables: [{ key: 'token', value: 'new' }],
      mergedVariables: [variable('token', 'old')],
      documentVariables: [],
      environmentExistsOnDocument: false,
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        environmentName: 'default',
        variable: { name: 'token', value: 'new' },
        index: 0,
        collectionType: 'workspace',
      },
    ])
  })

  it('updates an existing document variable in place by its document index', () => {
    const actions = getEnvironmentPersistenceActions({
      environmentName: 'default',
      seededVariables: { host: 'ws', token: 'old' },
      scriptVariables: [
        { key: 'host', value: 'ws' },
        { key: 'token', value: 'new' },
      ],
      // Merged order is [...workspace, ...document]; token lives on the document.
      mergedVariables: [variable('host', 'ws'), variable('token', 'old')],
      documentVariables: [variable('token', 'old')],
      environmentExistsOnDocument: true,
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        environmentName: 'default',
        variable: { name: 'token', value: 'new' },
        index: 0,
        collectionType: 'document',
      },
    ])
  })

  it('adds a new variable to the workspace when the environment lives on the workspace', () => {
    const actions = getEnvironmentPersistenceActions({
      environmentName: 'default',
      seededVariables: {},
      scriptVariables: [{ key: 'token', value: 'fresh' }],
      mergedVariables: [],
      documentVariables: [],
      environmentExistsOnDocument: false,
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        environmentName: 'default',
        variable: { name: 'token', value: 'fresh' },
        collectionType: 'workspace',
      },
    ])
  })

  it('adds a new variable to the document when the environment lives on the document', () => {
    const actions = getEnvironmentPersistenceActions({
      environmentName: 'default',
      seededVariables: {},
      scriptVariables: [{ key: 'token', value: 'fresh' }],
      mergedVariables: [],
      documentVariables: [],
      environmentExistsOnDocument: true,
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        environmentName: 'default',
        variable: { name: 'token', value: 'fresh' },
        collectionType: 'document',
      },
    ])
  })

  it('prefers the document scope when a name exists in both collections', () => {
    const actions = getEnvironmentPersistenceActions({
      environmentName: 'default',
      seededVariables: { token: 'doc' },
      scriptVariables: [{ key: 'token', value: 'updated' }],
      // Same name on both scopes: workspace copy first, document copy appended.
      mergedVariables: [variable('token', 'ws'), variable('token', 'doc')],
      documentVariables: [variable('token', 'doc')],
      environmentExistsOnDocument: true,
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        environmentName: 'default',
        variable: { name: 'token', value: 'updated' },
        index: 0,
        collectionType: 'document',
      },
    ])
  })

  it('accepts the store scope as a record', () => {
    const actions = getEnvironmentPersistenceActions({
      environmentName: 'default',
      seededVariables: { token: 'old' },
      scriptVariables: { token: 'new' },
      mergedVariables: [variable('token', 'old')],
      documentVariables: [],
      environmentExistsOnDocument: false,
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        environmentName: 'default',
        variable: { name: 'token', value: 'new' },
        index: 0,
        collectionType: 'workspace',
      },
    ])
  })

  it('deletes a variable removed by the script (pm.environment.unset)', () => {
    const actions = getEnvironmentPersistenceActions({
      environmentName: 'default',
      seededVariables: { token: 'abc' },
      // The script unset token, so it is absent from the store output.
      scriptVariables: [],
      mergedVariables: [variable('token', 'abc')],
      documentVariables: [],
      environmentExistsOnDocument: false,
    })

    expect(actions).toEqual([{ type: 'delete', environmentName: 'default', index: 0, collectionType: 'workspace' }])
  })

  it('deletes a removed document variable using its document index', () => {
    const actions = getEnvironmentPersistenceActions({
      environmentName: 'default',
      seededVariables: { host: 'ws', token: 'abc' },
      scriptVariables: [{ key: 'host', value: 'ws' }],
      mergedVariables: [variable('host', 'ws'), variable('token', 'abc')],
      documentVariables: [variable('token', 'abc')],
      environmentExistsOnDocument: true,
    })

    expect(actions).toEqual([{ type: 'delete', environmentName: 'default', index: 0, collectionType: 'document' }])
  })

  it('orders multiple deletes by descending index so splices stay valid', () => {
    const actions = getEnvironmentPersistenceActions({
      environmentName: 'default',
      seededVariables: { a: '1', b: '2', c: '3' },
      // Script removed a (index 0) and c (index 2), kept b.
      scriptVariables: [{ key: 'b', value: '2' }],
      mergedVariables: [variable('a', '1'), variable('b', '2'), variable('c', '3')],
      documentVariables: [],
      environmentExistsOnDocument: false,
    })

    expect(actions).toEqual([
      { type: 'delete', environmentName: 'default', index: 2, collectionType: 'workspace' },
      { type: 'delete', environmentName: 'default', index: 0, collectionType: 'workspace' },
    ])
  })

  it('emits upserts before deletes so in-place updates are not shifted', () => {
    const actions = getEnvironmentPersistenceActions({
      environmentName: 'default',
      seededVariables: { a: '1', b: '2' },
      // Script removed a and changed b.
      scriptVariables: [{ key: 'b', value: 'changed' }],
      mergedVariables: [variable('a', '1'), variable('b', '2')],
      documentVariables: [],
      environmentExistsOnDocument: false,
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        environmentName: 'default',
        variable: { name: 'b', value: 'changed' },
        index: 1,
        collectionType: 'workspace',
      },
      { type: 'delete', environmentName: 'default', index: 0, collectionType: 'workspace' },
    ])
  })
})
