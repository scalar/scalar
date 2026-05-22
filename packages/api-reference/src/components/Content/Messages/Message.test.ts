import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Message from './Message.vue'

const eventBus = createWorkspaceEventBus()

const baseOptions = {
  layout: 'modern' as const,
  orderRequiredPropertiesFirst: false,
  orderSchemaPropertiesBy: 'preserve' as const,
  hideModels: false,
}

describe('Message', () => {
  it('renders the title, summary, and content type', () => {
    const wrapper = mount(Message, {
      props: {
        id: 'message/LightOn',
        name: 'LightOn',
        message: {
          title: 'Light On Event',
          summary: 'A streetlight turned on.',
          contentType: 'application/json',
        },
        isCollapsed: false,
        options: baseOptions,
        eventBus,
      },
    })

    expect(wrapper.text()).toContain('Light On Event')
    expect(wrapper.text()).toContain('A streetlight turned on.')
    expect(wrapper.text()).toContain('application/json')
  })

  it('falls back to the entry name when title and message.name are missing', () => {
    const wrapper = mount(Message, {
      props: {
        id: 'message/LightOn',
        name: 'LightOn',
        message: {},
        isCollapsed: false,
        options: baseOptions,
        eventBus,
      },
    })

    expect(wrapper.text()).toContain('LightOn')
  })

  it('renders without throwing when payload is missing', () => {
    const wrapper = mount(Message, {
      props: {
        id: 'message/LightOn',
        name: 'LightOn',
        message: { title: 'Light On Event' },
        isCollapsed: false,
        options: baseOptions,
        eventBus,
      },
    })

    expect(wrapper.text()).toContain('Light On Event')
  })

  it('renders the resolved payload schema in the classic layout too', () => {
    const wrapper = mount(Message, {
      props: {
        id: 'message/LightOn',
        name: 'LightOn',
        message: {
          title: 'Light On Event',
          payload: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
        isCollapsed: false,
        options: { ...baseOptions, layout: 'classic' as const },
        eventBus,
      },
    })

    expect(wrapper.text()).toContain('Light On Event')
  })
})
