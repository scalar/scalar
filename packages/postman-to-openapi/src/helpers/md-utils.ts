const supHeaders = [
  'object',
  'name',
  'description',
  'example',
  'type',
  'required',
]

export function parseMdTable(md: string) {
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

  const tableObj = rows.reduce((accTable, cell) => {
    const cellObj = cell.reduce((accCell, field, index) => {
      if (headers[index]) {
        accCell[headers[index]] = field
      }
      return accCell
    }, {})
    accTable[cellObj.name] = cellObj
    return accTable
  }, {})

  return tableObj
}
