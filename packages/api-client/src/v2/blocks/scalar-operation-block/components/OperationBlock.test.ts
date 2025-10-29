import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import OperationBody from '@/v2/blocks/scalar-operation-block/components/OperationBody.vue'

import OperationBlock from './OperationBlock.vue'

const defaultProps = {
  method: 'get' as const,
  path: 'http://example.com/foo',
  operation: {
    summary: '',
  },
  exampleKey: 'example-1',
  securitySchemes: {},
  selectedSecurity: [],
  security: [],

  layout: 'web' as const,

  /** TODO: remove when we migrate */
  environment: {
    uid: 'some-uid' as any,
    name: 'some-name',
    value: 'some-value',
    color: 'some-color',
  },
  envVariables: [],
}

describe('OperationBlock', () => {
  it('renders request name input and emits on change for non-modal layout', async () => {
    const wrapper = mount(OperationBlock, {
      props: { ...defaultProps },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    // Placeholder falls back to path without protocol when summary is empty
    expect(input.attributes('placeholder')).toBe('example.com/foo')

    await input.setValue('New Name')

    const emitted = wrapper.emitted('operation:update:requestName')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toEqual({ name: 'New Name' })
  })

  it('renders summary text instead of input in modal layout', async () => {
    const wrapper = mount(OperationBlock, {
      props: { ...defaultProps, operation: { summary: 'My request' }, layout: 'modal' },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.find('span').text()).toBe('My request')
  })

  it('applies aria-label with request summary on the container', () => {
    const wrapper = mount(OperationBlock, {
      props: {
        ...defaultProps,
        operation: { ...(defaultProps.operation as any), summary: 'Summary' },
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.attributes('aria-label')).toBe('Request: Summary')
  })

  it('shows Auth section in modal layout', () => {
    const wrapper = mount(OperationBlock, {
      props: {
        ...defaultProps,
        layout: 'modal',
        securitySchemes: {
          a: {
            type: 'apiKey',
            'x-scalar-secret-token': '',
            name: 'X-API-Key',
            in: 'header',
          },
        },
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const auth = wrapper.findComponent(AuthSelector)
    expect(auth.exists()).toBe(true)
    expect(auth.isVisible()).toBe(true)
  })

  it('hides Auth section in modal layout when no security is configured', () => {
    const wrapper = mount(OperationBlock, {
      props: {
        ...defaultProps,
        layout: 'modal',
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const auth = wrapper.findComponent(AuthSelector)
    expect(auth.exists()).toBe(true)
    // The stub element exists but is hidden via v-show
    expect(auth.isVisible()).toBe(false)
  })

  it('shows Auth section when not in modal layout', () => {
    const wrapper = mount(OperationBlock, {
      props: { ...defaultProps },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const auth = wrapper.findComponent(AuthSelector)
    expect(auth.exists()).toBe(true)
    expect(auth.isVisible()).toBe(true)
  })

  it('hides request body for methods without a body', async () => {
    const wrapper = mount(OperationBlock, {
      props: { ...defaultProps, method: 'get' },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const bodyGet = wrapper.findComponent(OperationBody)
    expect(bodyGet.exists()).toBe(true)
    expect(bodyGet.isVisible()).toBe(false)
  })

  it('shows request body for methods with a body', async () => {
    const wrapper = mount(OperationBlock, {
      props: { ...defaultProps, method: 'post' },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const bodyGet = wrapper.findComponent(OperationBody)
    expect(bodyGet.exists()).toBe(true)
    expect(bodyGet.isVisible()).toBe(true)
  })

  it('re-emits auth events', () => {
    const wrapper = mount(OperationBlock, {
      props: { ...defaultProps },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const auth = wrapper.findComponent(AuthSelector)
    expect(auth.exists()).toBe(true)

    const deletePayload = ['a', 'b']
    auth.vm.$emit('deleteOperationAuth', deletePayload)
    expect(wrapper.emitted('auth:delete')?.[0]?.[0]).toEqual(deletePayload)

    const securitySchemePayload = { name: 'apiKey', type: 'apiKey' }
    auth.vm.$emit('update:securityScheme', securitySchemePayload)
    expect(wrapper.emitted('auth:update:securityScheme')?.[0]?.[0]).toEqual(securitySchemePayload)

    const scopesPayload = { id: ['id'], name: 'oauth2', scopes: ['read'] }
    auth.vm.$emit('update:selectedScopes', scopesPayload)
    expect(wrapper.emitted('auth:update:selectedScopes')?.[0]?.[0]).toEqual(scopesPayload)

    const selectedSecurityPayload = { value: ['apiKey'], create: [] }
    auth.vm.$emit('update:selectedSecurity', selectedSecurityPayload)
    expect(wrapper.emitted('auth:update:selectedSecurity')?.[0]?.[0]).toEqual(selectedSecurityPayload)
  })

  it('re-emits parameter add, update, and delete events with mapped types', () => {
    const wrapper = mount(OperationBlock, {
      props: { ...defaultProps },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const params = wrapper.findAllComponents({ name: 'OperationParams' })
    expect(params.length).toBe(4)

    const titleToType: Record<string, string> = {
      Variables: 'path',
      Cookies: 'cookie',
      Headers: 'header',
      'Query Parameters': 'query',
    }

    for (const p of params) {
      const title = (p.props() as any).title as string
      const expectedType = titleToType[title]

      p.vm.$emit('add', { key: 'k', value: 'v' })
      const lastAdd = wrapper.emitted('parameters:add')?.at(-1)?.[0]
      expect(lastAdd).toEqual({ type: expectedType, payload: { key: 'k', value: 'v' } })

      p.vm.$emit('update', { index: 1, payload: { key: 'x', value: 'y', isEnabled: true } })
      const lastUpdate = wrapper.emitted('parameters:update')?.at(-1)?.[0]
      expect(lastUpdate).toEqual({ type: expectedType, index: 1, payload: { key: 'x', value: 'y', isEnabled: true } })

      p.vm.$emit('delete', { index: 2 })
      const lastDelete = wrapper.emitted('parameters:delete')?.at(-1)?.[0]
      expect(lastDelete).toEqual({ type: expectedType, index: 2 })
    }
  })

  it('re-emits parameter deleteAll for Cookies with mapped type', () => {
    const wrapper = mount(OperationBlock, {
      props: { ...defaultProps },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const cookies = wrapper
      .findAllComponents({ name: 'OperationParams' })
      .find((p) => (p.props() as any).title === 'Cookies')
    expect(cookies).toBeTruthy()
    cookies!.vm.$emit('deleteAll')
    expect(wrapper.emitted('parameters:deleteAll')?.[0]?.[0]).toEqual({ type: 'cookie' })
  })

  it('re-emits request body events', () => {
    const wrapper = mount(OperationBlock, {
      props: { ...defaultProps, method: 'post' },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const body = wrapper.findComponent(OperationBody)
    expect(body.exists()).toBe(true)

    const contentTypePayload = { value: 'application/json' }
    body.vm.$emit('update:contentType', contentTypePayload)
    expect(wrapper.emitted('requestBody:update:contentType')?.[0]?.[0]).toEqual(contentTypePayload)

    const valuePayload = { value: 'hello' }
    body.vm.$emit('update:value', valuePayload)
    expect(wrapper.emitted('requestBody:update:value')?.[0]?.[0]).toEqual(valuePayload)

    const addFormRowPayload = { key: 'a', value: 'b' }
    body.vm.$emit('add:formRow', addFormRowPayload)
    expect(wrapper.emitted('requestBody:add:formRow')?.[0]?.[0]).toEqual(addFormRowPayload)

    const updateFormRowPayload = { index: 1, payload: { key: 'x', value: 'y' } }
    body.vm.$emit('update:formRow', updateFormRowPayload)
    expect(wrapper.emitted('requestBody:update:formRow')?.[0]?.[0]).toEqual(updateFormRowPayload)
  })

  it('renders plugin component when provided', () => {
    const wrapper = mount(OperationBlock, {
      props: {
        ...defaultProps,
        plugins: [
          {
            components: {
              request: defineComponent({
                props: {
                  operation: { type: Object, required: true },
                  selectedExample: { type: String, required: false },
                },
                template: '<div>Plugin Request Component</div>',
              }),
            },
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Plugin Request Component')
  })
})
