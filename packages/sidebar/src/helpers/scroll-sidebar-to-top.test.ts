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

const setOffsetParent = (element: HTMLElement, value: HTMLElement | null): void => {
  Object.defineProperty(element, 'offsetParent', {
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
    setOffsetParent(element, levelTwo)
    setOffsetParent(levelTwo, levelOne)
    setOffsetParent(levelOne, scroller)

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

  it('walks the offsetParent chain to avoid double-counting static wrappers', () => {
    const scroller = document.createElement('div')
    const sectionWrapper = document.createElement('div')
    const listWrapper = document.createElement('ul')
    const element = document.createElement('li')
    const scrollToSpy = vi.fn()

    scroller.className = 'custom-scroll'
    element.setAttribute('data-sidebar-id', 'offset-parent-item')
    Object.defineProperty(scroller, 'scrollTo', {
      value: scrollToSpy,
      configurable: true,
    })

    /**
     * `listWrapper` is a static wrapper whose offset is already measured against `scroller`.
     * If we walked `parentElement`, adding `listWrapper.offsetTop` would overcount.
     */
    setOffsetTop(element, 200)
    setOffsetTop(listWrapper, 200)
    setOffsetParent(element, scroller)
    setOffsetParent(listWrapper, scroller)

    listWrapper.append(element)
    sectionWrapper.append(listWrapper)
    scroller.append(sectionWrapper)
    document.body.append(scroller)

    scrollSidebarToTop('offset-parent-item')

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 100,
      behavior: 'smooth',
    })
  })

  it('uses the first measurable child offset when a section wrapper has no layout box', () => {
    const scroller = document.createElement('div')
    const section = document.createElement('li')
    const headingButton = document.createElement('div')
    const items = document.createElement('ul')
    const scrollToSpy = vi.fn()

    scroller.className = 'custom-scroll'
    section.style.display = 'contents'
    section.setAttribute('data-sidebar-id', 'tag-section-1')
    Object.defineProperty(scroller, 'scrollTo', {
      value: scrollToSpy,
      configurable: true,
    })

    /**
     * `ScalarSidebarSection` renders with `display: contents`, so its own layout box does not exist
     * and `offsetTop` reads as `0`. The visual row is represented by a measurable child.
     */
    setOffsetTop(section, 0)
    setOffsetTop(headingButton, 240)
    setOffsetParent(section, scroller)
    setOffsetParent(headingButton, scroller)

    section.append(headingButton)
    section.append(items)
    scroller.append(section)
    document.body.append(scroller)

    scrollSidebarToTop('tag-section-1')

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 140,
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
