import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ParameterList from './ParameterList.vue'
import ParameterListItem from './ParameterListItem.vue'

describe('ParameterList', () => {
  const defaultOptions = {
    collapsableItems: true,
    withExamples: true,
    orderRequiredPropertiesFirst: true,
    orderSchemaPropertiesBy: 'alpha' as const,
  }

  const createParameter = (name: string, overrides?: Partial<ParameterObject>): ParameterObject => ({
    name,
    in: 'query',
    required: false,
    schema: { type: 'string' },
    ...overrides,
  })

  it('renders parameters without ignore flags', () => {
    const parameters = [createParameter('param1'), createParameter('param2')]

    const wrapper = mount(ParameterList, {
      props: {
        parameters,
        options: defaultOptions,
      },
      slots: {
        title: 'Parameters',
      },
    })

    const items = wrapper.findAllComponents(ParameterListItem)
    expect(items).toHaveLength(2)
  })

  it('filters out parameters with x-internal flag set to true', () => {
    const parameters = [
      createParameter('param1'),
      createParameter('param2', { 'x-internal': true }),
      createParameter('param3'),
    ]

    const wrapper = mount(ParameterList, {
      props: {
        parameters,
        options: defaultOptions,
      },
      slots: {
        title: 'Parameters',
      },
    })

    const items = wrapper.findAllComponents(ParameterListItem)
    expect(items).toHaveLength(2)
    expect(items[0]?.props('name')).toBe('param1')
    expect(items[1]?.props('name')).toBe('param3')
  })

  it('filters out parameters with x-scalar-ignore flag set to true', () => {
    const parameters = [
      createParameter('param1'),
      createParameter('param2', { 'x-scalar-ignore': true }),
      createParameter('param3'),
    ]

    const wrapper = mount(ParameterList, {
      props: {
        parameters,
        options: defaultOptions,
      },
      slots: {
        title: 'Parameters',
      },
    })

    const items = wrapper.findAllComponents(ParameterListItem)
    expect(items).toHaveLength(2)
    expect(items[0]?.props('name')).toBe('param1')
    expect(items[1]?.props('name')).toBe('param3')
  })

  it('filters out parameters with both ignore flags', () => {
    const parameters = [
      createParameter('param1'),
      createParameter('param2', { 'x-internal': true, 'x-scalar-ignore': true }),
      createParameter('param3', { 'x-internal': true }),
      createParameter('param4', { 'x-scalar-ignore': true }),
      createParameter('param5'),
    ]

    const wrapper = mount(ParameterList, {
      props: {
        parameters,
        options: defaultOptions,
      },
      slots: {
        title: 'Parameters',
      },
    })

    const items = wrapper.findAllComponents(ParameterListItem)
    expect(items).toHaveLength(2)
    expect(items[0]?.props('name')).toBe('param1')
    expect(items[1]?.props('name')).toBe('param5')
  })

  it('renders nothing when parameters array is empty', () => {
    const wrapper = mount(ParameterList, {
      props: {
        parameters: [],
        options: defaultOptions,
      },
    })

    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('renders nothing when all parameters are filtered out', () => {
    const parameters = [
      createParameter('param1', { 'x-internal': true }),
      createParameter('param2', { 'x-scalar-ignore': true }),
    ]

    const wrapper = mount(ParameterList, {
      props: {
        parameters,
        options: defaultOptions,
      },
    })

    const items = wrapper.findAllComponents(ParameterListItem)
    expect(items).toHaveLength(0)
  })

  it('renders the title slot content', () => {
    const parameters = [createParameter('param1')]

    const wrapper = mount(ParameterList, {
      props: {
        parameters,
        options: defaultOptions,
      },
      slots: {
        title: 'Query Parameters',
      },
    })

    expect(wrapper.text()).toContain('Query Parameters')
  })

  it('passes breadcrumb prop to ParameterListItem', () => {
    const parameters = [createParameter('param1')]
    const breadcrumb = ['root', 'nested']

    const wrapper = mount(ParameterList, {
      props: {
        parameters,
        breadcrumb,
        options: defaultOptions,
      },
    })

    const item = wrapper.findComponent(ParameterListItem)
    expect(item.props('breadcrumb')).toEqual(breadcrumb)
  })

  it('passes options prop to ParameterListItem', () => {
    const parameters = [createParameter('param1')]
    const customOptions = {
      collapsableItems: false,
      withExamples: false,
      orderRequiredPropertiesFirst: false,
      orderSchemaPropertiesBy: 'preserve' as const,
    }

    const wrapper = mount(ParameterList, {
      props: {
        parameters,
        options: customOptions,
      },
    })

    const item = wrapper.findComponent(ParameterListItem)
    expect(item.props('options')).toEqual(customOptions)
  })

  it('passes parameter data to ParameterListItem', () => {
    const parameters = [
      createParameter('testParam', {
        required: true,
        description: 'A test parameter',
        schema: { type: 'number' },
      }),
    ]

    const wrapper = mount(ParameterList, {
      props: {
        parameters,
        options: defaultOptions,
      },
    })

    const item = wrapper.findComponent(ParameterListItem)
    expect(item.props('parameter')).toEqual(parameters[0])
    expect(item.props('name')).toBe('testParam')
  })
})
