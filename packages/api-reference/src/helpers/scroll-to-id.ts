/**
 * Tiny wrapper around the scrollIntoView API
 *
 * Also focuses the element if the focus flag is true
 */
export const scrollToId = async (id: string, focus?: boolean) => {
  const el = document.getElementById(id)
  if (!el) {
    return
  }
  el.scrollIntoView()
  if (focus) {
    el.focus()
  }
}
