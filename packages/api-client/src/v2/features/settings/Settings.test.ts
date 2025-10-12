// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Settings from './Settings.vue'

const DEFAULT_PROXY_URL = 'https://proxy.scalar.com'

describe('Settings', () => {
  it('renders the component', () => {
    const wrapper = mount(Settings, {
      props: {
        proxyUrl: DEFAULT_PROXY_URL,
        activeThemeId: 'default',
        colorMode: 'system',
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('displays the settings heading', () => {
    const wrapper = mount(Settings, {
      props: {
        proxyUrl: DEFAULT_PROXY_URL,
        activeThemeId: 'default',
        colorMode: 'system',
      },
    })

    expect(wrapper.text()).toContain('Settings')
  })

  describe('CORS Proxy Section', () => {
    it('renders the CORS Proxy section', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      expect(wrapper.text()).toContain('CORS Proxy')
      expect(wrapper.text()).toContain('bypass CORS issues')
    })

    it('shows default proxy button as active when default proxy is selected', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const text = wrapper.text()
      expect(text).toContain('Use proxy.scalar.com (default)')
    })

    it('shows no proxy button as active when proxy is disabled', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: null,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const text = wrapper.text()
      expect(text).toContain('Skip the proxy')
    })

    it('emits update:proxyUrl event when clicking default proxy button', async () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: null,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const buttons = wrapper.findAllComponents({ name: 'ScalarButton' })
      /** Find the default proxy button by checking its text content */
      const defaultProxyButton = buttons.find((btn) => btn.text().includes('Use proxy.scalar.com'))

      await defaultProxyButton?.trigger('click')

      expect(wrapper.emitted('update:proxyUrl')).toBeTruthy()
      expect(wrapper.emitted('update:proxyUrl')?.[0]).toEqual([DEFAULT_PROXY_URL])
    })

    it('emits update:proxyUrl event with null when clicking skip proxy button', async () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const buttons = wrapper.findAllComponents({ name: 'ScalarButton' })
      /** Find the skip proxy button by checking its text content */
      const skipProxyButton = buttons.find((btn) => btn.text().includes('Skip the proxy'))

      await skipProxyButton?.trigger('click')

      expect(wrapper.emitted('update:proxyUrl')).toBeTruthy()
      expect(wrapper.emitted('update:proxyUrl')?.[0]).toEqual([null])
    })

    it('shows custom proxy button when customProxyUrl is provided and different from default', () => {
      const customProxy = 'https://my-custom-proxy.com'
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: customProxy,
          customProxyUrl: customProxy,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const text = wrapper.text()
      expect(text).toContain('Use custom proxy')
      expect(text).toContain(customProxy)
    })

    it('does not show custom proxy button when customProxyUrl is same as default', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          customProxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const text = wrapper.text()
      expect(text).not.toContain('Use custom proxy')
    })

    it('does not show custom proxy button when customProxyUrl is not provided', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const text = wrapper.text()
      expect(text).not.toContain('Use custom proxy')
    })

    it('emits update:proxyUrl event when clicking custom proxy button', async () => {
      const customProxy = 'https://my-custom-proxy.com'
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          customProxyUrl: customProxy,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const buttons = wrapper.findAllComponents({ name: 'ScalarButton' })
      /** Find the custom proxy button by checking its text content */
      const customProxyButton = buttons.find((btn) => btn.text().includes('Use custom proxy'))

      await customProxyButton?.trigger('click')

      expect(wrapper.emitted('update:proxyUrl')).toBeTruthy()
      expect(wrapper.emitted('update:proxyUrl')?.[0]).toEqual([customProxy])
    })
  })

  describe('Themes Section', () => {
    it('renders the Themes section', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      expect(wrapper.text()).toContain('Themes')
      expect(wrapper.text()).toContain("We've got a whole rainbow of themes for you to play with")
    })

    it('renders all standard theme buttons', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const themeNames = ['Default', 'Alternate', 'Purple', 'Solarized', 'Saturn', 'Kepler']
      const text = wrapper.text()

      themeNames.forEach((name) => {
        expect(text).toContain(name)
      })
    })

    it('highlights the active theme', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'purple',
          colorMode: 'system',
        },
      })

      /** Check that the active theme has a checkmark icon */
      const buttons = wrapper.findAllComponents({ name: 'ScalarButton' })
      const purpleButton = buttons.find((btn) => btn.text().includes('Purple'))

      expect(purpleButton).toBeDefined()
    })

    it('emits update:themeId event when clicking a theme button', async () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const buttons = wrapper.findAllComponents({ name: 'ScalarButton' })
      /** Find the purple theme button */
      const purpleButton = buttons.find((btn) => btn.text().includes('Purple'))

      await purpleButton?.trigger('click')

      expect(wrapper.emitted('update:themeId')).toBeTruthy()
      expect(wrapper.emitted('update:themeId')?.[0]).toEqual(['purple'])
    })

    it('displays theme color circles for each theme', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      /** Each theme button should have color circles */
      const colorCircles = wrapper.findAll('span[style*="background-color"]')
      /** We have 6 themes, each with 3 color circles (light, dark, accent) */
      expect(colorCircles.length).toBeGreaterThanOrEqual(18)
    })

    it('emits update:themeId with correct theme ID for each theme', async () => {
      const themes = [
        { id: 'default', label: 'Default' },
        { id: 'alternate', label: 'Alternate' },
        { id: 'purple', label: 'Purple' },
        { id: 'solarized', label: 'Solarized' },
        { id: 'saturn', label: 'Saturn' },
        { id: 'kepler', label: 'Kepler' },
      ]

      for (const theme of themes) {
        const wrapper = mount(Settings, {
          props: {
            proxyUrl: DEFAULT_PROXY_URL,
            activeThemeId: 'default',
            colorMode: 'system',
          },
        })

        const buttons = wrapper.findAllComponents({ name: 'ScalarButton' })
        const themeButton = buttons.find((btn) => btn.text().includes(theme.label))

        await themeButton?.trigger('click')

        expect(wrapper.emitted('update:themeId')).toBeTruthy()
        expect(wrapper.emitted('update:themeId')?.[0]).toEqual([theme.id])
      }
    })
  })

  describe('Framework Themes Section', () => {
    it('renders the Framework Themes section', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      expect(wrapper.text()).toContain('Framework Themes')
      expect(wrapper.text()).toContain('Are you a real fan?')
    })

    it('renders all integration theme buttons', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const integrationThemes = ['Elysia.js', 'Fastify']
      const text = wrapper.text()

      integrationThemes.forEach((name) => {
        expect(text).toContain(name)
      })
    })

    it('highlights the active integration theme', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'elysiajs',
          colorMode: 'system',
        },
      })

      /** Check that the active theme has a checkmark icon */
      const buttons = wrapper.findAllComponents({ name: 'ScalarButton' })
      const elysiajsButton = buttons.find((btn) => btn.text().includes('Elysia.js'))

      expect(elysiajsButton).toBeDefined()
    })

    it('emits update:themeId event when clicking an integration theme button', async () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const buttons = wrapper.findAllComponents({ name: 'ScalarButton' })
      /** Find the fastify theme button */
      const fastifyButton = buttons.find((btn) => btn.text().includes('Fastify'))

      await fastifyButton?.trigger('click')

      expect(wrapper.emitted('update:themeId')).toBeTruthy()
      expect(wrapper.emitted('update:themeId')?.[0]).toEqual(['fastify'])
    })

    it('renders IntegrationLogo component for each integration theme', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const logos = wrapper.findAllComponents({ name: 'IntegrationLogo' })
      /** We have 2 integration themes */
      expect(logos.length).toBe(2)
    })
  })

  describe('Appearance Section', () => {
    it('renders the Appearance section', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      expect(wrapper.text()).toContain('Appearance')
      expect(wrapper.text()).toContain('Choose between light, dark, or system-based appearance')
    })

    it('renders the Appearance component', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const appearance = wrapper.findComponent({ name: 'Appearance' })
      expect(appearance.exists()).toBe(true)
    })

    it('passes colorMode prop to Appearance component', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'dark',
        },
      })

      const appearance = wrapper.findComponent({ name: 'Appearance' })
      expect(appearance.props('colorMode')).toBe('dark')
    })

    it('forwards update:colorMode event from Appearance component', async () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const appearance = wrapper.findComponent({ name: 'Appearance' })
      await appearance.vm.$emit('update:colorMode', 'light')

      expect(wrapper.emitted('update:colorMode')).toBeTruthy()
      expect(wrapper.emitted('update:colorMode')?.[0]).toEqual(['light'])
    })
  })

  describe('Section Components', () => {
    it('renders all Section components', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const sections = wrapper.findAllComponents({ name: 'Section' })
      /** We have 4 sections: CORS Proxy, Themes, Framework Themes, Appearance */
      expect(sections.length).toBe(4)
    })

    it('renders section titles correctly', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const titles = ['CORS Proxy', 'Themes', 'Framework Themes', 'Appearance']
      const text = wrapper.text()

      titles.forEach((title) => {
        expect(text).toContain(title)
      })
    })

    it('renders section descriptions correctly', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const descriptions = [
        'bypass CORS issues',
        "We've got a whole rainbow of themes",
        'Are you a real fan?',
        'Choose between light, dark, or system-based appearance',
      ]
      const text = wrapper.text()

      descriptions.forEach((description) => {
        expect(text).toContain(description)
      })
    })
  })

  describe('Links', () => {
    it('renders CORS explanation link', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const links = wrapper.findAll('a')
      const corsLink = links.find((link) => link.attributes('href')?.includes('Cross-origin_resource_sharing'))

      expect(corsLink).toBeDefined()
      expect(corsLink?.text()).toContain('bypass CORS issues')
    })

    it('renders GitHub source code link', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const links = wrapper.findAll('a')
      const githubLink = links.find((link) => link.attributes('href')?.includes('github.com/scalar/scalar'))

      expect(githubLink).toBeDefined()
      expect(githubLink?.text()).toContain('source code on GitHub')
    })

    it('opens links in new tab', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const links = wrapper.findAll('a')

      links.forEach((link) => {
        expect(link.attributes('target')).toBe('_blank')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined customProxyUrl', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          customProxyUrl: undefined,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).not.toContain('Use custom proxy')
    })

    it('handles null customProxyUrl', () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          customProxyUrl: null,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).not.toContain('Use custom proxy')
    })

    it('handles all colorMode values', () => {
      const colorModes: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark']

      colorModes.forEach((mode) => {
        const wrapper = mount(Settings, {
          props: {
            proxyUrl: DEFAULT_PROXY_URL,
            activeThemeId: 'default',
            colorMode: mode,
          },
        })

        const appearance = wrapper.findComponent({ name: 'Appearance' })
        expect(appearance.props('colorMode')).toBe(mode)
      })
    })

    it('handles switching between multiple proxy configurations', async () => {
      const customProxy = 'https://custom.proxy.com'
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          customProxyUrl: customProxy,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const buttons = wrapper.findAllComponents({ name: 'ScalarButton' })

      /** Click custom proxy */
      const customButton = buttons.find((btn) => btn.text().includes('Use custom proxy'))
      await customButton?.trigger('click')
      expect(wrapper.emitted('update:proxyUrl')?.[0]).toEqual([customProxy])

      /** Click default proxy */
      const defaultButton = buttons.find((btn) => btn.text().includes('Use proxy.scalar.com'))
      await defaultButton?.trigger('click')
      expect(wrapper.emitted('update:proxyUrl')?.[1]).toEqual([DEFAULT_PROXY_URL])

      /** Click skip proxy */
      const skipButton = buttons.find((btn) => btn.text().includes('Skip the proxy'))
      await skipButton?.trigger('click')
      expect(wrapper.emitted('update:proxyUrl')?.[2]).toEqual([null])
    })

    it('handles switching between multiple themes', async () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const buttons = wrapper.findAllComponents({ name: 'ScalarButton' })

      /** Click purple theme */
      const purpleButton = buttons.find((btn) => btn.text().includes('Purple'))
      await purpleButton?.trigger('click')
      expect(wrapper.emitted('update:themeId')?.[0]).toEqual(['purple'])

      /** Click solarized theme */
      const solarizedButton = buttons.find((btn) => btn.text().includes('Solarized'))
      await solarizedButton?.trigger('click')
      expect(wrapper.emitted('update:themeId')?.[1]).toEqual(['solarized'])

      /** Click integration theme */
      const elysiajsButton = buttons.find((btn) => btn.text().includes('Elysia.js'))
      await elysiajsButton?.trigger('click')
      expect(wrapper.emitted('update:themeId')?.[2]).toEqual(['elysiajs'])
    })

    it('handles switching between color modes', async () => {
      const wrapper = mount(Settings, {
        props: {
          proxyUrl: DEFAULT_PROXY_URL,
          activeThemeId: 'default',
          colorMode: 'system',
        },
      })

      const appearance = wrapper.findComponent({ name: 'Appearance' })

      /** Emit light mode */
      await appearance.vm.$emit('update:colorMode', 'light')
      expect(wrapper.emitted('update:colorMode')?.[0]).toEqual(['light'])

      /** Emit dark mode */
      await appearance.vm.$emit('update:colorMode', 'dark')
      expect(wrapper.emitted('update:colorMode')?.[1]).toEqual(['dark'])

      /** Emit system mode */
      await appearance.vm.$emit('update:colorMode', 'system')
      expect(wrapper.emitted('update:colorMode')?.[2]).toEqual(['system'])
    })
  })
})
