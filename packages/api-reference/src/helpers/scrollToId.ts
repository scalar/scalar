/**
 * Tiny wrapper around the scrollIntoView API
 */
export const scrollToId = async (id: string) => {
  const root =
    document.querySelector('scalar-api-reference')?.shadowRoot ?? document
  root.getElementById(id)?.scrollIntoView()
}
