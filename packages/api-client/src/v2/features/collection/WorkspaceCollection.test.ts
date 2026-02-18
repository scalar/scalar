import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { ROUTES } from '@/v2/features/app/helpers/routes'

import WorkspaceCollection from './WorkspaceCollection.vue'

describe('WorkspaceCollection', () => {
  const createRouterInstance = () =>
    createRouter({
      history: createWebHistory(),
      routes: ROUTES,
    })

  const mountWorkspaceCollection = async (activeWorkspaceLabel = 'My Workspace') => {
    const router = createRouterInstance()

    await router.push({
      name: 'workspace',
      params: {
        namespace: 'local',
        workspaceSlug: 'test-workspace',
      },
    })

    const eventBus = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    } as unknown as WorkspaceEventBus

    const wrapper = mount(WorkspaceCollection, {
      props: {
        activeWorkspace: { id: 'workspace-1', label: activeWorkspaceLabel },
        eventBus,
        documentSlug: 'drafts',
        document: null,
        layout: 'desktop' as any,
        environment: {} as any,
        securitySchemes: {},
        workspaceStore: {} as any,
        plugins: [],
      },
      global: {
        plugins: [router],
      },
    })

    await router.isReady()

    return { wrapper, eventBus }
  }

  describe('workspace title input', () => {
    it('resets the input to the original label when an empty value is submitted', async () => {
      const { wrapper } = await mountWorkspaceCollection('My Workspace')

      const input = wrapper.find('input')
      expect(input.exists()).toBe(true)
      expect(input.element.value).toBe('My Workspace')

      await input.setValue('')
      await input.trigger('blur')
      await nextTick()

      // Without the local ref reset, defineModel stays empty because the prop never changed.
      expect(input.element.value).toBe('My Workspace')
    })

    it('resets the input when a whitespace-only value is submitted', async () => {
      const { wrapper } = await mountWorkspaceCollection('My Workspace')

      const input = wrapper.find('input')

      await input.setValue('   ')
      await input.trigger('blur')
      await nextTick()

      expect(input.element.value).toBe('My Workspace')
    })

    it('emits workspace:update:name when a valid title is submitted on blur', async () => {
      const { wrapper, eventBus } = await mountWorkspaceCollection('My Workspace')

      const input = wrapper.find('input')

      await input.setValue('Renamed Workspace')
      await input.trigger('blur')

      expect(eventBus.emit).toHaveBeenCalledWith('workspace:update:name', 'Renamed Workspace')
    })

    it('does not emit workspace:update:name for an empty title', async () => {
      const { wrapper, eventBus } = await mountWorkspaceCollection('My Workspace')

      const input = wrapper.find('input')

      await input.setValue('')
      await input.trigger('blur')

      expect(eventBus.emit).not.toHaveBeenCalledWith('workspace:update:name', expect.anything())
    })

    it('does not emit workspace:update:name for a whitespace-only title', async () => {
      const { wrapper, eventBus } = await mountWorkspaceCollection('My Workspace')

      const input = wrapper.find('input')

      await input.setValue('   ')
      await input.trigger('blur')

      expect(eventBus.emit).not.toHaveBeenCalledWith('workspace:update:name', expect.anything())
    })
  })

  describe('workspace prop change (component reuse)', () => {
    it('updates the input when activeWorkspace.label changes to a new workspace', async () => {
      const { wrapper } = await mountWorkspaceCollection('Workspace A')

      const input = wrapper.find('input')
      expect(input.element.value).toBe('Workspace A')

      // Simulate Vue Router reusing the component — parent updates props without unmounting.
      await wrapper.setProps({
        activeWorkspace: { id: 'workspace-2', label: 'Workspace B' },
      })
      await nextTick()

      expect(input.element.value).toBe('Workspace B')
    })

    it('does not emit workspace:update:name with the old label after the workspace changes', async () => {
      const { wrapper, eventBus } = await mountWorkspaceCollection('Workspace A')

      await wrapper.setProps({
        activeWorkspace: { id: 'workspace-2', label: 'Workspace B' },
      })
      await nextTick()

      // Without the watch, a stale workspaceTitle would rename the new workspace to the old label on blur.
      const input = wrapper.find('input')
      await input.trigger('blur')

      expect(eventBus.emit).not.toHaveBeenCalledWith('workspace:update:name', 'Workspace A')
    })
  })
})
