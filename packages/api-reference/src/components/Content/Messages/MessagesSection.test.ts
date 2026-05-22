import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedMessages } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MessagesSection from './MessagesSection.vue'

const eventBus = createWorkspaceEventBus()

const options = {
  layout: 'modern' as const,
  orderRequiredPropertiesFirst: false,
  orderSchemaPropertiesBy: 'preserve' as const,
  hideModels: false,
}

const document: AsyncApiDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  components: {
    messages: {
      PlanetCreated: { title: 'Planet Created Event' },
      PlanetDeleted: { title: 'Planet Deleted Event' },
    },
  },
  'x-scalar-original-document-hash': '',
}

const container: TraversedMessages = {
  type: 'messages',
  id: 'doc/messages',
  title: 'Messages',
  name: 'Messages',
  children: [
    {
      type: 'message',
      id: 'doc/message/PlanetCreated',
      title: 'Planet Created Event',
      name: 'PlanetCreated',
      ref: '#/components/messages/PlanetCreated',
    },
    {
      type: 'message',
      id: 'doc/message/PlanetDeleted',
      title: 'Planet Deleted Event',
      name: 'PlanetDeleted',
      ref: '#/components/messages/PlanetDeleted',
    },
  ],
}

describe('MessagesSection', () => {
  it('renders one message per nav entry and uses the entry id as the anchor', () => {
    const wrapper = mount(MessagesSection, {
      props: { container, document, eventBus, expandedItems: {}, options },
    })

    expect(wrapper.text()).toContain('Planet Created Event')
    expect(wrapper.text()).toContain('Planet Deleted Event')
    expect(wrapper.html()).toContain('id="doc/message/PlanetCreated"')
    expect(wrapper.html()).toContain('id="doc/message/PlanetDeleted"')
  })

  it('skips nav entries that have no matching message in components.messages', () => {
    const containerWithOrphan: TraversedMessages = {
      ...container,
      children: [
        ...(container.children ?? []),
        {
          type: 'message',
          id: 'doc/message/Ghost',
          title: 'Ghost',
          name: 'Ghost',
          ref: '#/components/messages/Ghost',
        },
      ],
    }

    const wrapper = mount(MessagesSection, {
      props: { container: containerWithOrphan, document, eventBus, expandedItems: {}, options },
    })

    expect(wrapper.text()).not.toContain('Ghost')
  })
})
