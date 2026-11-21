/*
 * Search and filters for the Community Plugins page.
 *
 * The docs are a single-page app, so the page can mount and unmount at any time.
 * Listening on `document` keeps this working without re-binding after navigation.
 */
;(() => {
  const getRoot = (element) => element.closest('.community-plugins-filters')?.parentElement ?? document

  const applyFilters = (root) => {
    const filters = root.querySelector('.community-plugins-filters')
    if (!filters) {
      return
    }

    const query = (filters.querySelector('.community-plugins-search')?.value ?? '').trim().toLowerCase()
    const selected = {}
    filters.querySelectorAll('button[aria-pressed="true"]').forEach((button) => {
      selected[button.dataset.filterGroup] = button.dataset.filterValue
    })

    let visible = 0
    root.querySelectorAll('.community-plugin').forEach((plugin) => {
      const matchesQuery = !query || plugin.textContent.toLowerCase().includes(query)
      const matchesFilters = Object.entries(selected).every(
        ([group, value]) => !value || (plugin.dataset[group] ?? '').split(' ').includes(value),
      )
      const show = matchesQuery && matchesFilters
      plugin.hidden = !show
      if (show) {
        visible++
      }
    })

    const empty = filters.querySelector('.community-plugins-empty')
    if (empty) {
      empty.hidden = visible > 0
    }
  }

  document.addEventListener('input', (event) => {
    const target = event.target
    if (target instanceof HTMLInputElement && target.classList.contains('community-plugins-search')) {
      applyFilters(getRoot(target))
    }
  })

  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('button[data-filter-group]') : null
    if (!button?.closest('.community-plugins-filters')) {
      return
    }

    const group = button.dataset.filterGroup
    button
      .closest('.community-plugins-filters')
      .querySelectorAll(`button[data-filter-group="${group}"]`)
      .forEach((other) => other.setAttribute('aria-pressed', String(other === button)))

    applyFilters(getRoot(button))
  })
})()
