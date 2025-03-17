/**
 * Scrollbar Width Test
 *
 * Return true if scrollbars use up screen real estate.
 *
 * @see https://www.filamentgroup.com/lab/scrollbars/
 */
export function hasObtrusiveScrollbars(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Create a 30px square div
  const parent = document.createElement('div')
  parent.setAttribute('style', 'width:30px;height:30px;overflow-y:scroll;')
  parent.classList.add('scrollbar-test')

  // Create a 40px tall child div so it has to scroll
  const child = document.createElement('div')
  child.setAttribute('style', 'width:100%;height:40px')
  parent.appendChild(child)
  document.body.appendChild(parent)

  // Measure the child element, if it is not 30px wide the scrollbars are obtrusive
  const firstChild = parent.firstChild as HTMLDivElement
  const scrollbarWidth = 30 - firstChild.clientWidth

  document.body.removeChild(parent)

  return !!scrollbarWidth
}
