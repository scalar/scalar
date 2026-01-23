import type { OperationExampleMeta } from '@scalar/workspace-store/events'
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

  it('upserts a parameter with provided name and value', () => {
    const handlers = createParameterHandlers('query', mockEventBus, mockMeta, { context: [] })

    handlers.upsert(0, { name: 'foo', value: 'bar', isDisabled: false })

    expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:upsert:parameter',
      {
        type: 'query',
        index: 0,
        payload: {
          name: 'foo',
          value: 'bar',
          isDisabled: false,
        },
        meta: mockMeta,
      },
      {
        debounceKey: 'update:parameter-query-0',
      },
    )
  })

  it('upserts a parameter with all fields', () => {
    const handlers = createParameterHandlers('header', mockEventBus, mockMeta, { context: [] })

    handlers.upsert(1, { name: 'Authorization', value: 'Bearer token', isDisabled: true })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:upsert:parameter',
      {
        type: 'header',
        index: 1,
        payload: {
          name: 'Authorization',
          value: 'Bearer token',
          isDisabled: true,
        },
        meta: mockMeta,
      },
      {
        debounceKey: 'update:parameter-header-1',
      },
    )
  })

  it('deletes a parameter at the correct index', () => {
    const handlers = createParameterHandlers('path', mockEventBus, mockMeta, { context: [] })

    handlers.delete({ index: 2 })

    expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
    expect(mockEventBus.emit).toHaveBeenCalledWith('operation:delete:parameter', {
      type: 'path',
      index: 2,
      meta: mockMeta,
    })
  })

  it('deletes all parameters of the given type', () => {
    const handlers = createParameterHandlers('cookie', mockEventBus, mockMeta, { context: [] })

    handlers.deleteAll()

    expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
    expect(mockEventBus.emit).toHaveBeenCalledWith('operation:delete-all:parameters', {
      type: 'cookie',
      meta: mockMeta,
    })
  })

  it('handles offset when default parameters are present', () => {
    const handlers = createParameterHandlers('query', mockEventBus, mockMeta, {
      context: [],
      defaultParameters: 2,
    })

    handlers.upsert(3, { name: 'custom', value: 'value', isDisabled: false })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:upsert:parameter',
      {
        type: 'query',
        index: 1,
        payload: { name: 'custom', value: 'value', isDisabled: false },
        meta: mockMeta,
      },
      {
        debounceKey: 'update:parameter-query-1',
      },
    )
  })

  it('handles offset when global parameters are present', () => {
    const handlers = createParameterHandlers('header', mockEventBus, mockMeta, {
      context: [],
      globalParameters: 3,
    })

    handlers.upsert(4, { name: 'X-Custom', value: 'test', isDisabled: false })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:upsert:parameter',
      {
        type: 'header',
        index: 1,
        payload: { name: 'X-Custom', value: 'test', isDisabled: false },
        meta: mockMeta,
      },
      {
        debounceKey: 'update:parameter-header-1',
      },
    )
  })

  it('handles offset when both default and global parameters are present', () => {
    const handlers = createParameterHandlers('query', mockEventBus, mockMeta, {
      context: [],
      defaultParameters: 2,
      globalParameters: 1,
    })

    handlers.upsert(5, { name: 'page', value: '1', isDisabled: false })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:upsert:parameter',
      {
        type: 'query',
        index: 2,
        payload: { name: 'page', value: '1', isDisabled: false },
        meta: mockMeta,
      },
      {
        debounceKey: 'update:parameter-query-2',
      },
    )
  })

  it('updates default extra parameters when index is within default range', () => {
    const context = [
      { name: 'defaultParam', value: 'value', isDisabled: false },
      { name: 'anotherDefault', value: 'value2', isDisabled: false },
    ]
    const handlers = createParameterHandlers('query', mockEventBus, mockMeta, {
      context,
      defaultParameters: 2,
    })

    handlers.upsert(0, { name: 'defaultParam', value: 'value', isDisabled: true })

    expect(mockEventBus.emit).toHaveBeenCalledWith('operation:update:extra-parameters', {
      type: 'default',
      in: 'query',
      meta: { ...mockMeta, name: 'defaultparam' },
      payload: { isDisabled: true },
    })
  })

  it('updates global extra parameters when index is within global range', () => {
    const context = [
      { name: 'defaultParam', value: 'value', isDisabled: false },
      { name: 'globalParam', value: 'value2', isDisabled: false },
    ]
    const handlers = createParameterHandlers('header', mockEventBus, mockMeta, {
      context,
      defaultParameters: 1,
      globalParameters: 1,
    })

    handlers.upsert(1, { name: 'globalParam', value: 'value2', isDisabled: true })

    expect(mockEventBus.emit).toHaveBeenCalledWith('operation:update:extra-parameters', {
      type: 'global',
      in: 'header',
      meta: { ...mockMeta, name: 'globalparam' },
      payload: { isDisabled: true },
    })
  })

  it('adjusts delete index based on offset', () => {
    const handlers = createParameterHandlers('query', mockEventBus, mockMeta, {
      context: [],
      defaultParameters: 2,
      globalParameters: 1,
    })

    handlers.delete({ index: 5 })

    expect(mockEventBus.emit).toHaveBeenCalledWith('operation:delete:parameter', {
      type: 'query',
      index: 2,
      meta: mockMeta,
    })
  })
})
