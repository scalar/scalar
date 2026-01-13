import type { OperationExampleMeta } from '@scalar/workspace-store/mutators'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockEventBus } from '../../../helpers/test-utils'
import { createParameterHandlers } from './create-parameter-handlers'

describe('createParameterHandlers', () => {
  const mockMeta: OperationExampleMeta = {
    exampleKey: 'test-example',
    method: 'get',
    path: '/test',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits add event with provided name and value', () => {
    const handlers = createParameterHandlers('query', mockEventBus, mockMeta)

    handlers.add({ name: 'foo', value: 'bar' })

    expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
    expect(mockEventBus.emit).toHaveBeenCalledWith('operation:add:parameter', {
      type: 'query',
      payload: {
        name: 'foo',
        value: 'bar',
        isDisabled: false,
      },
      meta: mockMeta,
    })
  })

  it('defaults to empty strings when name or value are missing', () => {
    const handlers = createParameterHandlers('header', mockEventBus, mockMeta)

    handlers.add({})

    expect(mockEventBus.emit).toHaveBeenCalledWith('operation:add:parameter', {
      type: 'header',
      payload: {
        name: '',
        value: '',
        isDisabled: false,
      },
      meta: mockMeta,
    })

    vi.clearAllMocks()

    handlers.add({ name: 'Authorization' })

    expect(mockEventBus.emit).toHaveBeenCalledWith('operation:add:parameter', {
      type: 'header',
      payload: {
        name: 'Authorization',
        value: '',
        isDisabled: false,
      },
      meta: mockMeta,
    })
  })

  it('emits delete event with correct index and parameter type', () => {
    const handlers = createParameterHandlers('path', mockEventBus, mockMeta)

    handlers.delete({ index: 2 })

    expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
    expect(mockEventBus.emit).toHaveBeenCalledWith('operation:delete:parameter', {
      type: 'path',
      index: 2,
      meta: mockMeta,
    })
  })

  it('emits deleteAll event with correct parameter type', () => {
    const handlers = createParameterHandlers('cookie', mockEventBus, mockMeta)

    handlers.deleteAll()

    expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
    expect(mockEventBus.emit).toHaveBeenCalledWith('operation:delete-all:parameters', {
      type: 'cookie',
      meta: mockMeta,
    })
  })

  it('emits update event with partial payload and handles all parameter types', () => {
    const handlers = createParameterHandlers('query', mockEventBus, mockMeta)

    // Update only name
    handlers.update({ index: 1, payload: { name: 'updated-key' } })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:update:parameter',
      {
        type: 'query',
        index: 1,
        payload: { name: 'updated-key' },
        meta: mockMeta,
      },
      {
        debounceKey: 'update:parameter-query-1-name',
      },
    )

    vi.clearAllMocks()

    // Update only value
    handlers.update({ index: 0, payload: { value: 'new-value' } })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:update:parameter',
      {
        type: 'query',
        index: 0,
        payload: { value: 'new-value' },
        meta: mockMeta,
      },
      {
        debounceKey: 'update:parameter-query-0-value',
      },
    )

    vi.clearAllMocks()

    // Update only isDisabled
    handlers.update({ index: 3, payload: { isDisabled: true } })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:update:parameter',
      {
        type: 'query',
        index: 3,
        payload: { isDisabled: true },
        meta: mockMeta,
      },
      {
        debounceKey: 'update:parameter-query-3-isDisabled',
      },
    )

    vi.clearAllMocks()

    // Update all fields at once
    handlers.update({
      index: 2,
      payload: { name: 'complete', value: 'update', isDisabled: false },
    })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:update:parameter',
      {
        type: 'query',
        index: 2,
        payload: { name: 'complete', value: 'update', isDisabled: false },
        meta: mockMeta,
      },
      {
        debounceKey: 'update:parameter-query-2-name-value-isDisabled',
      },
    )
  })
})
