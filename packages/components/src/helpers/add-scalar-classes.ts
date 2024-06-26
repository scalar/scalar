/** Helper method for adding the scalar classes to HeadlessUI portal root */
export const addScalarClassesToHeadless = () => {
  const observer = new MutationObserver((records: MutationRecord[]) => {
    const headlessRoot = records.find((record) =>
      Array.from(record.addedNodes).find(
        (node) => (node as HTMLDivElement).id === 'headlessui-portal-root',
      ),
    )
    if (headlessRoot) {
      const el = headlessRoot.addedNodes[0] as HTMLDivElement
      el.classList.add('scalar-app')
      el.classList.add('scalar-client')
      observer.disconnect()
    }
  })
  observer.observe(document.body, { childList: true })
}
