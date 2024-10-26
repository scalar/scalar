const supHeaders = [
  'object',
  'name',
  'description',
  'example',
  'type',
  'required',
]

type TableCell = {
  [key: string]: string
}

type TableObject = {
  [key: string]: TableCell
}

/**
 * Parses a Markdown table and returns an object representation.
 */
export function parseMdTable(md: string): TableObject {
  const lines = md.split('\n').filter((line) => line.trim() !== '')
  if (lines.length < 3) return {}

  const header = lines[0]
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)
  if (!header.includes('object') || !header.includes('name')) return {}

  const headers = header.map((h) => (supHeaders.includes(h) ? h : false))

  const rows = lines.slice(2).map((line) =>
    line
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean),
  )

  const tableObj: TableObject = rows.reduce((accTable: TableObject, cell) => {
    const cellObj: TableCell = cell.reduce(
      (accCell: TableCell, field, index) => {
        if (headers[index] && typeof headers[index] === 'string') {
          accCell[headers[index] as string] = field
        }
        return accCell
      },
      {},
    )
    if (cellObj.name) {
      accTable[cellObj.name] = cellObj
    }
    return accTable
  }, {})

  return tableObj
}
