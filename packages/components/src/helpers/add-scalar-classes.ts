/**
 * Helper method for adding the scalar classes to HeadlessUI portal root
 */
export const addScalarClassesToHeadless = () => {
  const headlessRoot = document.getElementById('headlessui-portal-root')

  // The element already exists
  if (headlessRoot) {
    headlessRoot.classList.add('scalar-app')
    headlessRoot.classList.add('scalar-client')
  }

  // Mutation observer to catch the element being added later
  else {
    const observer = new MutationObserver((records: MutationRecord[]) => {
      const headlessMutation = records.find((record) =>
        Array.from(record.addedNodes).find((node) => (node as HTMLDivElement).id === 'headlessui-portal-root'),
      )
      if (headlessMutation) {
        const el = headlessMutation.addedNodes[0] as HTMLDivElement
        el.classList.add('scalar-app')
        el.classList.add('scalar-client')
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true })
  }
}
