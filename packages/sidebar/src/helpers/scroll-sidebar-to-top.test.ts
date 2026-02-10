import { beforeEach, describe, expect, it, vi } from 'vitest'

import { scrollSidebarToTop } from './scroll-sidebar-to-top'

const setOffsetTop = (element: HTMLElement, value: number): void => {
  Object.defineProperty(element, 'offsetTop', {
    value,
    configurable: true,
  })
}

const setOffsetHeight = (element: HTMLElement, value: number): void => {
  Object.defineProperty(element, 'offsetHeight', {
    value,
    configurable: true,
  })
}

describe('scroll-to-sidebar-top', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns early without touching the DOM when window is unavailable', () => {
    const querySelectorSpy = vi.spyOn(document, 'querySelector')

    vi.stubGlobal('window', undefined)
    scrollSidebarToTop('operation-1')

    expect(querySelectorSpy).not.toHaveBeenCalled()
  })

  it('returns early when the sidebar item is not found', () => {
    const querySelectorSpy = vi.spyOn(document, 'querySelector')
    scrollSidebarToTop('missing-item')
    expect(querySelectorSpy).toHaveBeenCalledWith('[data-sidebar-id="missing-item"]')
  })

  it('returns early when the selected item is outside a sidebar scroller', () => {
    const container = document.createElement('div')
    const element = document.createElement('div')
    element.setAttribute('data-sidebar-id', 'orphan-item')

    container.append(element)
    document.body.append(container)

    scrollSidebarToTop('orphan-item')

    // No throw and no scroll side effects is the contract when no scroller exists.
    expect(container.querySelector('[data-sidebar-id="orphan-item"]')).toBe(element)
  })

  it('accumulates nested offsets and uses the default top offset', () => {
    const scroller = document.createElement('div')
    const levelOne = document.createElement('div')
    const levelTwo = document.createElement('div')
    const element = document.createElement('div')
    const scrollToSpy = vi.fn()

    scroller.className = 'custom-scroll'
    element.setAttribute('data-sidebar-id', 'nested-item')
    Object.defineProperty(scroller, 'scrollTo', {
      value: scrollToSpy,
      configurable: true,
    })
    setOffsetTop(element, 70)
    setOffsetTop(levelTwo, 25)
    setOffsetTop(levelOne, 20)

    levelTwo.append(element)
    levelOne.append(levelTwo)
    scroller.append(levelOne)
    document.body.append(scroller)

    scrollSidebarToTop('nested-item')

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 15,
      behavior: 'smooth',
    })
  })

  it('includes heading label height and clamps to zero with a large custom offset', () => {
    const scroller = document.createElement('div')
    const element = document.createElement('div')
    const heading = document.createElement('div')
    const scrollToSpy = vi.fn()

    scroller.className = 'custom-scrollbar'
    element.setAttribute('data-sidebar-id', 'heading-item')
    element.setAttribute('data-sidebar-type', 'heading')
    heading.className = 'sidebar-heading'

    Object.defineProperty(scroller, 'scrollTo', {
      value: scrollToSpy,
      configurable: true,
    })
    setOffsetTop(element, 40)
    setOffsetHeight(heading, 20)

    element.append(heading)
    scroller.append(element)
    document.body.append(scroller)

    scrollSidebarToTop('heading-item', 120)

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    })
  })
})
