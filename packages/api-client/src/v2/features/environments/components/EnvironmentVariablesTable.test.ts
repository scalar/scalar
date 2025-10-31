import { xScalarEnvironmentSchema } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CodeInput } from '@/v2/components/code-input'
import { mockEventBus } from '@/v2/helpers/test-utils'

import EnvironmentVariablesTable from './EnvironmentVariablesTable.vue'

const createMockEnvironment = (variables: any[] = []) =>
  coerceValue(xScalarEnvironmentSchema, {
    color: '#FF0000',
    variables,
  })

describe('EnvironmentVariablesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits event when adding a new variable in the empty row', async () => {
    const environment = createMockEnvironment([{ name: 'API_URL', value: 'https://api.com' }])

    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        environment,
        environmentName: 'production',
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * The component should have 4 CodeInput components: 2 for the existing
     * variable (name + value) and 2 for the empty row (name + value).
     * When we update the name in the empty row, it should emit an event.
     */
    const codeInputs = wrapper.findAllComponents(CodeInput)
    expect(codeInputs).toHaveLength(4)

    const emptyRowNameInput = codeInputs.at(2)!
    await emptyRowNameInput.vm.$emit('update:modelValue', 'NEW_VAR')

    expect(mockEventBus.emit).toHaveBeenCalledWith('environment:upsert:environment-variable', {
      environmentName: 'production',
      variable: { name: 'NEW_VAR', value: '' },
      collectionType: 'document',
    })
  })

  it('emits event when updating an existing variable', async () => {
    const environment = createMockEnvironment([
      { name: 'API_URL', value: 'https://api.com' },
      { name: 'API_KEY', value: 'secret123' },
    ])

    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        environment,
        environmentName: 'development',
        eventBus: mockEventBus,
        collectionType: 'workspace',
      },
    })

    /**
     * When changing the value of the first variable,
     * it should emit an update event with the index.
     * CodeInput index 1 is the value input for the first variable row.
     */
    const codeInputs = wrapper.findAllComponents(CodeInput)
    const firstValueInput = codeInputs.at(1)!
    await firstValueInput.vm.$emit('update:modelValue', 'https://api.newdomain.com')

    expect(mockEventBus.emit).toHaveBeenCalledWith('environment:upsert:environment-variable', {
      environmentName: 'development',
      variable: { name: 'API_URL', value: 'https://api.newdomain.com' },
      index: 0,
      collectionType: 'workspace',
    })
  })

  it('emits event when clicking delete button on an existing variable', async () => {
    const environment = createMockEnvironment([
      { name: 'API_URL', value: 'https://api.com' },
      { name: 'API_KEY', value: 'secret123' },
    ])

    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        environment,
        environmentName: 'production',
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * Delete buttons should only appear for existing variables.
     * Clicking the delete button on the second variable (index 1)
     * should emit a delete event with that index.
     */
    const deleteButtons = wrapper.findAll('button')
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2)

    await deleteButtons.at(1)!.trigger('click')

    expect(mockEventBus.emit).toHaveBeenCalledWith('environment:delete:environment-variable', {
      environmentName: 'production',
      index: 1,
      collectionType: 'document',
    })
  })

  it('does not add a new variable when name is empty in the last row', async () => {
    const environment = createMockEnvironment([{ name: 'API_URL', value: 'https://api.com' }])

    const wrapper = mount(EnvironmentVariablesTable, {
      props: {
        environment,
        environmentName: 'production',
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * When updating only the value (not the name) in the empty row,
     * no event should be emitted because we require a name to create
     * a new variable. CodeInput index 3 is the value input for the empty row.
     */
    const codeInputs = wrapper.findAllComponents(CodeInput)
    const emptyRowValueInput = codeInputs.at(3)!
    await emptyRowValueInput.vm.$emit('update:modelValue', 'some-value')

    expect(mockEventBus.emit).not.toHaveBeenCalled()
  })

  it('always displays an empty row at the end for adding new variables', () => {
    const environmentWithVariables = createMockEnvironment([
      { name: 'API_URL', value: 'https://api.com' },
      { name: 'API_KEY', value: 'secret123' },
    ])

    const wrapperWithVariables = mount(EnvironmentVariablesTable, {
      props: {
        environment: environmentWithVariables,
        environmentName: 'production',
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * With 2 existing variables, there should be 6 CodeInput components:
     * 2 variables × 2 inputs (name + value) + 1 empty row × 2 inputs.
     */
    const codeInputsWithVariables = wrapperWithVariables.findAllComponents(CodeInput)
    expect(codeInputsWithVariables).toHaveLength(6)

    const emptyEnvironment = createMockEnvironment([])

    const wrapperEmpty = mount(EnvironmentVariablesTable, {
      props: {
        environment: emptyEnvironment,
        environmentName: 'production',
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * With no existing variables, there should still be 2 CodeInput components
     * for the empty row (name + value).
     */
    const codeInputsEmpty = wrapperEmpty.findAllComponents(CodeInput)
    expect(codeInputsEmpty).toHaveLength(2)
  })
})
