import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import type { Crumb, HeaderTagChain } from './helpers'
import { useActiveTagChain } from './use-active-tag-chain'

describe('useActiveTagChain', () => {
  const crumb = (title: string): Crumb => ({ id: title.toLowerCase(), title })

  const chains: HeaderTagChain[] = [
    { id: 'galaxy', chain: [crumb('Galaxy')] },
    { id: 'planets', chain: [crumb('Galaxy'), crumb('Planets')] },
    { id: 'moons', chain: [crumb('Galaxy'), crumb('Planets'), crumb('Moons')] },
    { id: 'deep-space', chain: [crumb('Deep space')] },
    { id: 'stars', chain: [crumb('Deep space'), crumb('Stars')] },
  ]

  /** Simulated viewport `top` of each heading, keyed by id. A heading counts as entered when top <= 49. */
  let tops: Record<string, number> = {}

  /** Pending rAF callbacks, flushed manually so `frame` bookkeeping mirrors real async timing. */
  const frames: FrameRequestCallback[] = []
  const flush = () => frames.splice(0).forEach((callback) => callback(0))

  beforeEach(() => {
    frames.length = 0
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    // The bar rests at top:0 with a 48px height, so the trigger line lands at 49.
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ top: '0px' } as CSSStyleDeclaration)

    vi.spyOn(document, 'getElementById').mockImplementation((id: string) =>
      id in tops ? ({ getBoundingClientRect: () => ({ top: tops[id] }) } as unknown as HTMLElement) : null,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    tops = {}
  })

  /** Mount the composable and return a getter for the live active chain (titles only). */
  const setup = () => {
    let chainRef: { value: Crumb[] } = { value: [] }

    const wrapper = mount(
      defineComponent({
        setup() {
          chainRef = useActiveTagChain(chains, () => ({ offsetHeight: 48 }) as HTMLElement)
          return () => h('div')
        },
      }),
    )

    return {
      wrapper,
      titles: () => chainRef.value.map((entry) => entry.title),
    }
  }

  /** Dispatch a scroll and run the coalesced measurement it schedules. */
  const scroll = () => {
    window.dispatchEvent(new Event('scroll'))
    flush()
  }

  it('falls back to the first tag while every heading is still below the bar', () => {
    tops = { galaxy: 200, planets: 400, moons: 600, 'deep-space': 800, stars: 1000 }

    const { titles } = setup()
    flush()

    expect(titles()).toEqual(['Galaxy'])
  })

  it('shows just the top-level tag once its heading is pinned', () => {
    const { titles } = setup()

    tops = { galaxy: 40, planets: 300, moons: 600, 'deep-space': 800, stars: 1000 }
    scroll()

    expect(titles()).toEqual(['Galaxy'])
  })

  it('adds ancestors as deeper headings scroll past the bar', () => {
    const { titles } = setup()

    tops = { galaxy: -200, planets: -100, moons: 40, 'deep-space': 800, stars: 1000 }
    scroll()

    expect(titles()).toEqual(['Galaxy', 'Planets', 'Moons'])
  })

  it('resets to a sibling branch when its heading takes over', () => {
    const { titles } = setup()

    tops = { galaxy: -800, planets: -600, moons: -400, 'deep-space': 40, stars: 300 }
    scroll()

    expect(titles()).toEqual(['Deep space'])
  })

  it('ignores headings that are not rendered yet', () => {
    const { titles } = setup()

    // Moons is collapsed/not in the DOM, so the deepest entered heading is Planets.
    tops = { galaxy: -200, planets: -100, 'deep-space': 800, stars: 1000 }
    scroll()

    expect(titles()).toEqual(['Galaxy', 'Planets'])
  })
})
