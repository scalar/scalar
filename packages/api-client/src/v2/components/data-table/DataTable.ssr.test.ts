import { expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import DataTable from './DataTable.vue'
import DataTableCell from './DataTableCell.vue'
import DataTableRow from './DataTableRow.vue'

/** Server-renders a table holding a single row, the way a reference page renders an auth form. */
const renderTable = () =>
  renderToString(
    createSSRApp({
      render: () => h(DataTable, { columns: ['1fr'] }, () => h(DataTableRow, () => h(DataTableCell, () => 'Value'))),
    }),
  )

/**
 * The HTML parser inserts a `tbody` around rows that sit directly under a `table`, so markup
 * rendered without one hydrates into a tree the client never built: the browser hands Vue a
 * `tbody` where the vdom holds the `tr`, and the whole table is discarded and rebuilt.
 */
it('wraps the rows in a tbody', async () => {
  const html = await renderTable()

  const table = html.indexOf('<table')
  const tbody = html.indexOf('<tbody')
  const row = html.indexOf('<tr')

  expect(tbody).toBeGreaterThan(table)
  expect(row).toBeGreaterThan(tbody)
})
