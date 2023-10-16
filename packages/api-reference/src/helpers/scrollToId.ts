/**
 * Tiny wrapper around the scrollIntoView API
 */
export const scrollToId = async (id: string) => {
  document.getElementById(id)?.scrollIntoView()
}
