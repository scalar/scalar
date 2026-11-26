import type { TableCell } from '@/types'

const supHeaders = ['object', 'name', 'description', 'example', 'type', 'required']

/**
 * Preserves rows in order so callers can distinguish parameters by location.
 */
export function parseMdTable(md: string): TableCell[] {
  const lines = md.split('\n').filter((line) => line.trim() !== '')
  if (typeof lines[0] === 'undefined' || lines.length < 3) {
    return []
  }

  const header = lines[0]
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)
  if (!header.includes('object') || !header.includes('name')) {
    return []
  }

  const headers = header.map((h) => (supHeaders.includes(h) ? h : false))

  return lines.slice(2).flatMap((line) => {
    const cells = line
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean)
    const row: TableCell = {}
    cells.forEach((value, index) => {
      const headerName = headers[index]
      if (headerName) {
        row[headerName] = value
      }
    })
    return row.name ? [row] : []
  })
}
