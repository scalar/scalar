import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { createAsyncApiSchemaResourceResolver } from '@scalar/workspace-store/helpers/async-api-schema-resources/resolver'
import { ASYNC_API_SCHEMA_RESOURCES } from '@scalar/workspace-store/helpers/use-async-api-schema-resources'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import SourceModel from './SourceModel.vue'

describe('SourceModel', () => {
  it.each(['classic', 'modern'] as const)(
    'defers collapsed %s models and shares downloads across remounts',
    async (layout) => {
      const requested: string[] = []
      const resolve = createAsyncApiSchemaResourceResolver({
        fetch: (input) => {
          requested.push(String(input))
          return Promise.resolve(new Response('syntax="proto3"; message User { string external_id=1; }'))
        },
      })
      const wrapper = mount(SourceModel, {
        props: {
          id: 'models-root',
          name: 'Root',
          layout,
          isCollapsed: true,
          eventBus: createWorkspaceEventBus(),
          format: 'application/vnd.google.protobuf;version=3',
          value: 'syntax="proto3"; import "user.proto"; message Root { User user=1; }',
          resources: { origin: 'https://example.test/root.proto', files: {}, deferred: true },
          options: { expandAllSchemaProperties: true },
        },
        global: { provide: { [ASYNC_API_SCHEMA_RESOURCES]: () => resolve } },
      })
      await flushPromises()
      expect(requested).toStrictEqual([])
      await wrapper.setProps({ isCollapsed: false })
      await vi.waitFor(() => expect(wrapper.text()).toContain('external_id'))
      expect(requested).toStrictEqual(['https://example.test/user.proto'])
      await wrapper.setProps({ isCollapsed: true })
      await wrapper.setProps({ isCollapsed: false })
      await vi.waitFor(() => expect(wrapper.text()).toContain('external_id'))
      expect(requested).toStrictEqual(['https://example.test/user.proto'])
      wrapper.unmount()
    },
  )
})
