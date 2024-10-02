/**
 * Parses a Markdown table into an object representation.
 *
 * @param {string} md - The Markdown string containing the table.
 * @returns {Record<string, Record<string, string>>} - The parsed table as an object.
 */
export function parseMdTable(
  md: string,
): Record<string, Record<string, string>> {
  const SUPPORTED_HEADERS = [
    'object',
    'name',
    'description',
    'example',
    'type',
    'required',
  ]

  const lines = md.split('\n')
  const tableLines = lines.filter(
    (line) => line.trim() && (line.startsWith('|') || line.startsWith('-')),
  )

  if (tableLines.length < 3) return {}

  const headerLine = tableLines[0]
    .split('|')
    .map((cell) => cell.trim())
    .filter((cell) => cell)
  const headers = headerLine.map((h) =>
    SUPPORTED_HEADERS.includes(h) ? h : undefined,
  )

  if (!headers.includes('object') || !headers.includes('name')) return {}

  const tableObj = tableLines.slice(2).reduce(
    (accTable, line) => {
      const cells = line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell)
      const cellObj = cells.reduce(
        (accCell, field, index) => {
          const headerName = headers[index]
          if (headerName) {
            accCell[headerName] = field
          }
          return accCell
        },
        {} as Record<string, string>,
      )

      if (cellObj.name) {
        accTable[cellObj.name] = cellObj
      }

      return accTable
    },
    {} as Record<string, Record<string, string>>,
  )

  return tableObj
}
