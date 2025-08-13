import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import XBadges from './XBadges.vue'

describe('XBadges', () => {
  const createBadge = (name: string, position: 'before' | 'after' | undefined, color: string) => ({
    name,
    position,
    color,
  })

  describe('badge filtering', () => {
    it('filters badges by before position', () => {
      const badges = [
        createBadge('Badge 1', 'before', 'red'),
        createBadge('Badge 2', 'after', 'blue'),
        createBadge('Badge 3', 'before', 'green'),
      ]

      const wrapper = mount(XBadges, {
        props: { position: 'before', badges },
      })

      const renderedBadges = wrapper.findAll('.badge')
      expect(renderedBadges).toHaveLength(2)
      expect(renderedBadges[0].text()).toBe('Badge 1')
      expect(renderedBadges[1].text()).toBe('Badge 3')
    })

    it('filters badges by after position', () => {
      const badges = [
        createBadge('Badge 1', 'before', 'red'),
        createBadge('Badge 2', 'after', 'blue'),
        createBadge('Badge 3', undefined, 'green'),
      ]

      const wrapper = mount(XBadges, {
        props: { position: 'after', badges },
      })

      const renderedBadges = wrapper.findAll('.badge')
      expect(renderedBadges).toHaveLength(2)
      expect(renderedBadges[0].text()).toBe('Badge 2')
      expect(renderedBadges[1].text()).toBe('Badge 3')
    })

    it('includes badges without position when filtering for after', () => {
      const badges = [
        createBadge('Badge 1', undefined, 'red'),
        createBadge('Badge 2', 'after', 'blue'),
        createBadge('Badge 3', 'before', 'green'),
      ]

      const wrapper = mount(XBadges, {
        props: { position: 'after', badges },
      })

      const renderedBadges = wrapper.findAll('.badge')
      expect(renderedBadges).toHaveLength(2)
      expect(renderedBadges[0].text()).toBe('Badge 1')
      expect(renderedBadges[1].text()).toBe('Badge 2')
    })

    it('excludes badges without position when filtering for before', () => {
      const badges = [
        createBadge('Badge 1', 'before', 'red'),
        createBadge('Badge 2', undefined, 'blue'),
        createBadge('Badge 3', 'before', 'green'),
      ]

      const wrapper = mount(XBadges, {
        props: { position: 'before', badges },
      })

      const renderedBadges = wrapper.findAll('.badge')
      expect(renderedBadges).toHaveLength(2)
      expect(renderedBadges[0].text()).toBe('Badge 1')
      expect(renderedBadges[1].text()).toBe('Badge 3')
    })
  })

  describe('edge cases and error handling', () => {
    it('handles empty badges array', () => {
      const wrapper = mount(XBadges, {
        props: { position: 'before', badges: [] },
      })

      const renderedBadges = wrapper.findAll('.badge')
      expect(renderedBadges).toHaveLength(0)
    })

    it('handles null badges', () => {
      const wrapper = mount(XBadges, {
        props: { position: 'before', badges: null },
      })

      const renderedBadges = wrapper.findAll('.badge')
      expect(renderedBadges).toHaveLength(0)
    })

    it('handles undefined badges', () => {
      const wrapper = mount(XBadges, {
        props: { position: 'before', badges: undefined },
      })

      const renderedBadges = wrapper.findAll('.badge')
      expect(renderedBadges).toHaveLength(0)
    })

    it('handles non-array badges gracefully', () => {
      const wrapper = mount(XBadges, {
        props: { position: 'before', badges: 'not-an-array' },
      })

      const renderedBadges = wrapper.findAll('.badge')
      expect(renderedBadges).toHaveLength(0)
    })

    it('handles mixed valid and invalid badge data', () => {
      const badges = [
        createBadge('Valid Badge', 'before', 'red'),
        { invalid: 'badge' },
        createBadge('Another Valid', 'before', 'blue'),
      ]

      const wrapper = mount(XBadges, {
        props: { position: 'before', badges },
      })

      const renderedBadges = wrapper.findAll('.badge')
      expect(renderedBadges).toHaveLength(2)
      expect(renderedBadges[0].text()).toBe('Valid Badge')
      expect(renderedBadges[1].text()).toBe('Another Valid')
    })
  })

  describe('badge rendering', () => {
    it('renders badges with correct color props', () => {
      const badges = [createBadge('Red Badge', 'before', 'red'), createBadge('Blue Badge', 'before', 'blue')]

      const wrapper = mount(XBadges, {
        props: { position: 'before', badges },
      })

      const renderedBadges = wrapper.findAll('.badge')
      expect(renderedBadges[0].attributes('style')).toContain('color: red')
      expect(renderedBadges[1].attributes('style')).toContain('color: blue')
    })

    it('renders badge names as text content', () => {
      const badges = [createBadge('Test Badge', 'before', 'red')]

      const wrapper = mount(XBadges, {
        props: { position: 'before', badges },
      })

      const badge = wrapper.find('.badge')
      expect(badge.text()).toBe('Test Badge')
    })

    it('renders badges in correct order', () => {
      const badges = [createBadge('Badge 1', 'before', 'red'), createBadge('Badge 2', 'before', 'blue')]

      const wrapper = mount(XBadges, {
        props: { position: 'before', badges },
      })

      const renderedBadges = wrapper.findAll('.badge')
      expect(renderedBadges).toHaveLength(2)

      // Verify that badges are rendered in the correct order
      expect(renderedBadges[0].text()).toBe('Badge 1')
      expect(renderedBadges[1].text()).toBe('Badge 2')
    })

    describe('position-specific behavior', () => {
      it('only shows badges for before position when position is before', () => {
        const badges = [
          createBadge('Before Badge', 'before', 'red'),
          createBadge('After Badge', 'after', 'blue'),
          createBadge('No Position Badge', undefined, 'green'),
        ]

        const wrapper = mount(XBadges, {
          props: { position: 'before', badges },
        })

        const renderedBadges = wrapper.findAll('.badge')
        expect(renderedBadges).toHaveLength(1)
        expect(renderedBadges[0].text()).toBe('Before Badge')
      })

      it('shows after badges and no-position badges when position is after', () => {
        const badges = [
          createBadge('Before Badge', 'before', 'red'),
          createBadge('After Badge', 'after', 'blue'),
          createBadge('No Position Badge', undefined, 'green'),
        ]

        const wrapper = mount(XBadges, {
          props: { position: 'after', badges },
        })

        const renderedBadges = wrapper.findAll('.badge')
        expect(renderedBadges).toHaveLength(2)
        expect(renderedBadges[0].text()).toBe('After Badge')
        expect(renderedBadges[1].text()).toBe('No Position Badge')
      })
    })
  })
})
