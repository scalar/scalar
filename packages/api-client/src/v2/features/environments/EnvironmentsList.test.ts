import { xScalarEnvironmentsSchema } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { mockEventBus } from '@/v2/helpers/test-utils'

import EnvironmentComponent from './components/Environment.vue'
import EnvironmentCreateModal from './components/EnvironmentCreateModal.vue'
import EnvironmentDeleteModal from './components/EnvironmentDeleteModal.vue'
import EnvironmentsList from './EnvironmentsList.vue'

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
      variables: [
        {
          uid: '3' as any,
          name: 'API_URL',
          value: 'https://api.dev.com',
          color: '',
        },
      ],
    },
    staging: {
      color: '#0000FF',
      variables: [
        {
          uid: '4' as any,
          name: 'API_URL',
          value: 'https://api.staging.com',
          color: '',
        },
      ],
    },
  },
})['x-scalar-environments']!

describe('EnvironmentsList', () => {
  it('renders all environments as EnvironmentComponent instances', () => {
    const wrapper = mount(EnvironmentsList, {
      props: {
        environments: mockEnvironments,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)

    /**
     * Each environment in the environments object maps to one EnvironmentComponent.
     * This ensures all environments are displayed correctly.
     */
    expect(environmentComponents).toHaveLength(3)

    const firstComponent = environmentComponents[0]
    expect(firstComponent?.props('environmentName')).toBe('production')
    expect(firstComponent?.props('environment')).toEqual(mockEnvironments.production)
    expect(firstComponent?.props('collectionType')).toBe('document')
    expect(firstComponent?.props('eventBus')).toStrictEqual(mockEventBus)
  })

  it('opens delete modal and sets selected environment when delete is triggered', async () => {
    const wrapper = mount(EnvironmentsList, {
      props: {
        environments: mockEnvironments,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)
    const deleteModal = wrapper.findComponent(EnvironmentDeleteModal)

    /**
     * Before emitting delete, the modal state is hidden and
     * selectedEnvironmentName is not set.
     */
    expect(deleteModal.props('name')).toBeNull()

    /**
     * Trigger the delete event on the first environment component.
     * This simulates a user clicking the delete button.
     */
    await environmentComponents[0]?.vm.$emit('delete')
    await wrapper.vm.$nextTick()

    /**
     * After triggering delete, the modal receives the correct environment name
     * which is used to display confirmation text to the user.
     */
    expect(deleteModal.props('name')).toBe('production')
  })

  it('emits delete event with correct payload when delete is confirmed', async () => {
    const wrapper = mount(EnvironmentsList, {
      props: {
        environments: mockEnvironments,
        eventBus: mockEventBus,
        collectionType: 'workspace',
      },
    })

    const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)
    const deleteModal = wrapper.findComponent(EnvironmentDeleteModal)

    /**
     * First, open the delete modal by triggering delete on the development environment.
     */
    await environmentComponents[1]?.vm.$emit('delete')

    /**
     * Now trigger the submit event from the modal, simulating
     * the user confirming the deletion.
     */
    await deleteModal.vm.$emit('submit')

    /**
     * The eventBus emit function is called with the correct event name
     * and payload containing the environment name and collection type.
     */
    expect(mockEventBus.emit).toHaveBeenCalledWith('environment:delete:environment', {
      environmentName: 'development',
      collectionType: 'workspace',
    })
  })

  it('opens upsert modal with null selectedEnvironmentName for new environment', async () => {
    const wrapper = mount(EnvironmentsList, {
      props: {
        environments: mockEnvironments,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    const createModal = wrapper.findComponent(EnvironmentCreateModal)

    /**
     * Initially, selectedEnvironmentName is null because
     * no environment is being edited.
     */
    expect(createModal.props('selectedEnvironmentName')).toBeNull()

    /**
     * Clicking the "Add Environment" button opens the create modal
     * with null selectedEnvironmentName, indicating we are creating
     * a new environment rather than editing an existing one.
     * We find the button by its text content to ensure we click the correct one.
     */
    const addButton = wrapper.findAll('button').find((button) => button.text().includes('Add Environment'))!
    await addButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(createModal.props('selectedEnvironmentName')).toBeNull()
    expect(createModal.props('collectionType')).toBe('document')
    expect(createModal.props('environments')).toEqual(mockEnvironments)
  })

  it('opens upsert modal with selected environment name for editing', async () => {
    const wrapper = mount(EnvironmentsList, {
      props: {
        environments: mockEnvironments,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    const environmentComponents = wrapper.findAllComponents(EnvironmentComponent)
    const createModal = wrapper.findComponent(EnvironmentCreateModal)

    /**
     * Trigger the edit event on the staging environment.
     * This simulates a user clicking the edit button.
     */
    await environmentComponents[2]?.vm.$emit('edit')
    await wrapper.vm.$nextTick()

    /**
     * After triggering edit, the modal receives the staging environment name.
     * The modal uses this to pre-populate the form with existing values.
     */
    expect(createModal.props('selectedEnvironmentName')).toBe('staging')
    expect(createModal.props('collectionType')).toBe('document')
  })
})
