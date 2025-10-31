import { xScalarEnvironmentsSchema } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { mockEventBus } from '@/v2/helpers/test-utils'

import Environment from './Environment.vue'
import EnvironmentVariablesTable from './EnvironmentVariablesTable.vue'

const mockEnvironments = coerceValue(xScalarEnvironmentsSchema, {
  'x-scalar-environments': {
    production: {
      color: '#FF0000',
      variables: [
        {
          uid: '1' as any,
          name: 'API_URL',
          value: 'https://api.production.com',
          color: '',
        },
        {
          uid: '2' as any,
          name: 'API_KEY',
          value: 'prod-key-123',
          color: '',
        },
      ],
    },
    development: {
      color: '#00FF00',
      variables: [],
    },
  },
})['x-scalar-environments']!

describe('Environment', () => {
  it('renders environment name and color indicator correctly', () => {
    const wrapper = mount(Environment, {
      props: {
        environmentName: 'production',
        environment: mockEnvironments.production!,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * The environment name is displayed to help users identify
     * which environment they are viewing or editing.
     */
    expect(wrapper.text()).toContain('production')

    /**
     * The color indicator is a small circle that helps users
     * visually distinguish between different environments.
     */
    const colorIndicator = wrapper.find('.rounded-full')
    expect(colorIndicator.exists()).toBe(true)
    expect(colorIndicator.attributes('style')).toContain('background-color: rgb(255, 0, 0)')
  })

  it('emits edit event when edit button is clicked', async () => {
    const wrapper = mount(Environment, {
      props: {
        environmentName: 'production',
        environment: mockEnvironments.production!,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * The edit button allows users to modify environment details.
     * We find it using findAllComponents to locate the ScalarIconButton with the edit icon.
     */
    const iconButtons = wrapper.findAllComponents({ name: 'ScalarIconButton' })
    const editButton = iconButtons.find((btn) => btn.props('label')?.includes('Edit'))
    await editButton?.trigger('click')

    /**
     * The edit event is emitted to the parent component so it can
     * open the edit modal with the correct environment data.
     */
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')).toHaveLength(1)
  })

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(Environment, {
      props: {
        environmentName: 'development',
        environment: mockEnvironments.development!,
        eventBus: mockEventBus,
        collectionType: 'workspace',
      },
    })

    /**
     * The delete button allows users to remove an environment.
     * We find it using findAllComponents to locate the ScalarIconButton with the delete icon.
     */
    const iconButtons = wrapper.findAllComponents({ name: 'ScalarIconButton' })
    const deleteButton = iconButtons.find((btn) => btn.props('label')?.includes('Delete'))
    await deleteButton?.trigger('click')

    /**
     * The delete event is emitted to the parent component so it can
     * show a confirmation modal before actually deleting the environment.
     */
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('passes all required props correctly to EnvironmentVariablesTable', () => {
    const wrapper = mount(Environment, {
      props: {
        environmentName: 'production',
        environment: mockEnvironments.production!,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    const variablesTable = wrapper.findComponent(EnvironmentVariablesTable)

    /**
     * The EnvironmentVariablesTable needs all these props to function correctly.
     * This ensures the table can display and edit environment variables properly.
     */
    expect(variablesTable.exists()).toBe(true)
    expect(variablesTable.props('environmentName')).toBe('production')
    expect(variablesTable.props('environment')).toEqual(mockEnvironments.production)
    expect(variablesTable.props('collectionType')).toBe('document')
    expect(variablesTable.props('eventBus')).toStrictEqual(mockEventBus)
  })

  it('handles environments with no variables gracefully', () => {
    const wrapper = mount(Environment, {
      props: {
        environmentName: 'development',
        environment: mockEnvironments.development!,
        eventBus: mockEventBus,
        collectionType: 'workspace',
      },
    })

    /**
     * Even when an environment has no variables, the component renders without errors
     * and the EnvironmentVariablesTable is still rendered to allow adding new variables.
     */
    expect(wrapper.text()).toContain('development')

    const variablesTable = wrapper.findComponent(EnvironmentVariablesTable)
    expect(variablesTable.exists()).toBe(true)
    expect(variablesTable.props('environment').variables).toEqual([])
  })
})
