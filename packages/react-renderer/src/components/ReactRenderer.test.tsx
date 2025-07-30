// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import type { FC } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ReactConnector } from './ReactConnector'
import ReactRenderer from './ReactRenderer.vue'

/**
 * Those tests are a bit flaky, so we're retrying them 3 times.
 */

describe('ReactRenderer', { retry: 3 }, () => {
  let TestComponent: FC<{ message?: string }>
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    TestComponent = ({ message = 'Default message' }) => <div data-testid="react-test">{message}</div>
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('renders the React component', async () => {
    wrapper = mount(ReactRenderer, {
      props: {
        component: TestComponent,
      },
    })

    // Wait for component to mount and React to render
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const reactElement = wrapper.find('[data-testid="react-test"]')
    expect(reactElement.exists()).toBe(true)
    expect(reactElement.text()).toBe('Default message')
  })

  it('passes props to React component correctly', async () => {
    wrapper = mount(ReactRenderer, {
      props: {
        component: TestComponent,
        message: 'Custom message',
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const reactElement = wrapper.find('[data-testid="react-test"]')
    expect(reactElement.exists()).toBe(true)
    expect(reactElement.text()).toBe('Custom message')
  })

  it('transforms kebab-case props to camelCase', async () => {
    const CaseTestComponent: FC<{ customProp?: string }> = ({ customProp = '' }) => (
      <div data-testid="case-test">{customProp}</div>
    )

    wrapper = mount(ReactRenderer, {
      props: {
        component: CaseTestComponent,
        'custom-prop': 'test value',
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const reactElement = wrapper.find('[data-testid="case-test"]')
    expect(reactElement.exists()).toBe(true)
    expect(reactElement.text()).toBe('test value')
  })

  it('throws error when component prop is not provided', () => {
    expect(() => {
      wrapper = mount(ReactRenderer, {
        props: {
          // @ts-expect-error Testing error case
          component: undefined,
        },
      })
    }).toThrow('Component is required')
  })

  it('cleans up React component on unmount', async () => {
    wrapper = mount(ReactRenderer, {
      props: {
        component: TestComponent,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const reactElement = wrapper.find('[data-testid="react-test"]')
    expect(reactElement.exists()).toBe(true)

    wrapper.unmount()
    expect(document.querySelector('[data-testid="react-test"]')).toBeFalsy()
  })
})

describe('ReactConnector', { retry: 3 }, () => {
  let container: HTMLDivElement
  let connectors: ReactConnector[] = []

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    // Reset the static roots map before each test
    ;(ReactConnector as any).roots = new Map()
  })

  afterEach(() => {
    connectors.forEach((connector) => connector.cleanup())
    connectors = []
    document.body.removeChild(container)
  })

  it('creates a root and renders a React component', async () => {
    const TestComponent: FC<{ message: string }> = ({ message }) => <div data-testid="test">{message}</div>
    const connector = new ReactConnector(container, TestComponent)
    connectors.push(connector)

    connector.render({ message: 'Hello from React' })

    // Wait for React to render
    await new Promise((resolve) => setTimeout(resolve, 0))

    const element = container.querySelector('[data-testid="test"]')
    expect(element).toBeTruthy()
    expect(element?.textContent).toBe('Hello from React')
  })

  it('reuses existing root for same container', () => {
    const TestComponent: FC = () => <div>Test</div>

    const connector1 = new ReactConnector(container, TestComponent)
    connectors.push(connector1)
    const connector2 = new ReactConnector(container, TestComponent)
    connectors.push(connector2)

    // Access private static roots Map through type assertion
    const roots = (ReactConnector as any).roots
    expect(roots.size).toBe(1)
  })

  it('transforms props correctly', async () => {
    const TestComponent: FC<{ testProp: string }> = ({ testProp }) => <div data-testid="test">{testProp}</div>

    const connector = new ReactConnector(container, TestComponent)
    connectors.push(connector)
    connector.render({ testProp: 'test value' })

    // Wait for React to render
    await new Promise((resolve) => setTimeout(resolve, 0))

    const element = container.querySelector('[data-testid="test"]')
    expect(element).toBeTruthy()
    expect(element?.textContent).toBe('test value')
  })
})
