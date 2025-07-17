const CLASS_NAME = 'scalar-app'
const ROOT_ID = 'headlessui-portal-root'

/**
 * Type guard to check if an element is an HTMLElement
 */
const isHTMLElement = (element: Node | Element | null): element is HTMLElement => {
  return element !== null && element instanceof HTMLElement
}

/**
 * Helper method for adding the scalar classes to an element
 */
const addClasses = (el?: HTMLElement | undefined | null) => {
  if (!el || el.classList.contains(CLASS_NAME)) {
    return
  }

  el.classList.add(CLASS_NAME)
}

/**
 * Makes sure the scalar classes are added to the HeadlessUI portal root
 *
 * Returns the mutation observer instance
 */
export const addScalarClassesToHeadless = () => {
  // Add classes to the element if it already exists
  addClasses(document.getElementById(ROOT_ID))

  // Mutation observer to catch the element being added or removed later
  const observer = new MutationObserver((records: MutationRecord[]) =>
    records.forEach(({ addedNodes }) =>
      addedNodes.forEach((node) => {
        if (isHTMLElement(node) && node.id === ROOT_ID) {
          addClasses(node)
        }
      }),
    ),
  )

  // Observe the body for changes to the portal root
  observer.observe(document.body, { childList: true })

  return observer
}
