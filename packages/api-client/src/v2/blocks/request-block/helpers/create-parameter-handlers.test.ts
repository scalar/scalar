import type { OperationExampleMeta } from '@scalar/workspace-store/events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'

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
    const mockRow: TableRow = {
      name: 'foo',
      value: 'bar',
      isDisabled: false,
      originalParameter: { name: 'foo', in: 'query' },
    }
    const handlers = createParameterHandlers('query', mockEventBus, mockMeta, { context: [mockRow] })

    handlers.upsert(0, { name: 'foo', value: 'bar', isDisabled: false })

    expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:upsert:parameter',
      {
        type: 'query',
        payload: {
          name: 'foo',
          value: 'bar',
          isDisabled: false,
        },
        originalParameter: { name: 'foo', in: 'query' },
        meta: mockMeta,
      },
      {
        skipUnpackProxy: true,
        debounceKey: 'update:parameter-query-0',
      },
    )
  })

  it('upserts a parameter with all fields', () => {
    const mockRow: TableRow = {
      name: 'Authorization',
      value: 'Bearer token',
      isDisabled: true,
      originalParameter: { name: 'Authorization', in: 'header' },
    }
    const handlers = createParameterHandlers('header', mockEventBus, mockMeta, { context: [mockRow] })

    handlers.upsert(0, { name: 'Authorization', value: 'Bearer token', isDisabled: true })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:upsert:parameter',
      {
        type: 'header',
        payload: {
          name: 'Authorization',
          value: 'Bearer token',
          isDisabled: true,
        },
        originalParameter: { name: 'Authorization', in: 'header' },
        meta: mockMeta,
      },
      {
        skipUnpackProxy: true,
        debounceKey: 'update:parameter-header-0',
      },
    )
  })

  it('deletes a parameter at the correct index', () => {
    const mockRow: TableRow = {
      name: 'id',
      value: '123',
      isDisabled: false,
      originalParameter: { name: 'id', in: 'path' },
    }
    const handlers = createParameterHandlers('path', mockEventBus, mockMeta, {
      context: [mockRow, mockRow, mockRow],
    })

    handlers.delete({ index: 2 })

    expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:delete:parameter',
      {
        originalParameter: { name: 'id', in: 'path' },
        meta: mockMeta,
      },
      {
        skipUnpackProxy: true,
      },
    )
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
    const defaultRow1: TableRow = {
      name: 'default1',
      value: 'val1',
      isDisabled: false,
      originalParameter: { name: 'default1', in: 'query' },
    }
    const defaultRow2: TableRow = {
      name: 'default2',
      value: 'val2',
      isDisabled: false,
      originalParameter: { name: 'default2', in: 'query' },
    }
    const customRow: TableRow = {
      name: 'custom',
      value: 'value',
      isDisabled: false,
      originalParameter: { name: 'custom', in: 'query' },
    }
    const handlers = createParameterHandlers('query', mockEventBus, mockMeta, {
      context: [defaultRow1, defaultRow2, customRow],
      defaultParameters: 2,
    })

    handlers.upsert(2, { name: 'custom', value: 'value', isDisabled: false })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:upsert:parameter',
      {
        type: 'query',
        payload: { name: 'custom', value: 'value', isDisabled: false },
        originalParameter: { name: 'custom', in: 'query' },
        meta: mockMeta,
      },
      {
        skipUnpackProxy: true,
        debounceKey: 'update:parameter-query-0',
      },
    )
  })

  it('handles offset when global parameters are present', () => {
    const globalRow1: TableRow = {
      name: 'global1',
      value: 'val1',
      isDisabled: false,
      originalParameter: { name: 'global1', in: 'header' },
    }
    const globalRow2: TableRow = {
      name: 'global2',
      value: 'val2',
      isDisabled: false,
      originalParameter: { name: 'global2', in: 'header' },
    }
    const globalRow3: TableRow = {
      name: 'global3',
      value: 'val3',
      isDisabled: false,
      originalParameter: { name: 'global3', in: 'header' },
    }
    const customRow: TableRow = {
      name: 'X-Custom',
      value: 'test',
      isDisabled: false,
      originalParameter: { name: 'X-Custom', in: 'header' },
    }
    const handlers = createParameterHandlers('header', mockEventBus, mockMeta, {
      context: [globalRow1, globalRow2, globalRow3, customRow],
      globalParameters: 3,
    })

    handlers.upsert(3, { name: 'X-Custom', value: 'test', isDisabled: false })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:upsert:parameter',
      {
        type: 'header',
        payload: { name: 'X-Custom', value: 'test', isDisabled: false },
        originalParameter: { name: 'X-Custom', in: 'header' },
        meta: mockMeta,
      },
      {
        skipUnpackProxy: true,
        debounceKey: 'update:parameter-header-0',
      },
    )
  })

  it('handles offset when both default and global parameters are present', () => {
    const defaultRow1: TableRow = {
      name: 'default1',
      value: 'val1',
      isDisabled: false,
      originalParameter: { name: 'default1', in: 'query' },
    }
    const defaultRow2: TableRow = {
      name: 'default2',
      value: 'val2',
      isDisabled: false,
      originalParameter: { name: 'default2', in: 'query' },
    }
    const globalRow: TableRow = {
      name: 'global1',
      value: 'val3',
      isDisabled: false,
      originalParameter: { name: 'global1', in: 'query' },
    }
    const customRow: TableRow = {
      name: 'page',
      value: '1',
      isDisabled: false,
      originalParameter: { name: 'page', in: 'query' },
    }
    const handlers = createParameterHandlers('query', mockEventBus, mockMeta, {
      context: [defaultRow1, defaultRow2, globalRow, customRow],
      defaultParameters: 2,
      globalParameters: 1,
    })

    handlers.upsert(3, { name: 'page', value: '1', isDisabled: false })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:upsert:parameter',
      {
        type: 'query',
        payload: { name: 'page', value: '1', isDisabled: false },
        originalParameter: { name: 'page', in: 'query' },
        meta: mockMeta,
      },
      {
        skipUnpackProxy: true,
        debounceKey: 'update:parameter-query-0',
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
    const defaultRow1: TableRow = {
      name: 'default1',
      value: 'val1',
      isDisabled: false,
      originalParameter: { name: 'default1', in: 'query' },
    }
    const defaultRow2: TableRow = {
      name: 'default2',
      value: 'val2',
      isDisabled: false,
      originalParameter: { name: 'default2', in: 'query' },
    }
    const globalRow: TableRow = {
      name: 'global1',
      value: 'val3',
      isDisabled: false,
      originalParameter: { name: 'global1', in: 'query' },
    }
    const customRow1: TableRow = {
      name: 'custom1',
      value: 'val4',
      isDisabled: false,
      originalParameter: { name: 'custom1', in: 'query' },
    }
    const customRow2: TableRow = {
      name: 'custom2',
      value: 'val5',
      isDisabled: false,
      originalParameter: { name: 'custom2', in: 'query' },
    }
    const customRow3: TableRow = {
      name: 'custom3',
      value: 'val6',
      isDisabled: false,
      originalParameter: { name: 'custom3', in: 'query' },
    }
    const handlers = createParameterHandlers('query', mockEventBus, mockMeta, {
      context: [defaultRow1, defaultRow2, globalRow, customRow1, customRow2, customRow3],
      defaultParameters: 2,
      globalParameters: 1,
    })

    handlers.delete({ index: 5 })

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'operation:delete:parameter',
      {
        originalParameter: { name: 'custom3', in: 'query' },
        meta: mockMeta,
      },
      {
        skipUnpackProxy: true,
      },
    )
  })
})
