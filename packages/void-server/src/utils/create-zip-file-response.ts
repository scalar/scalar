import type { Context } from 'hono'

/**
 * Creates a ZIP response with a request.json file.
 */
export function createZipFileResponse(c: Context, data: Record<string, unknown>) {
  const fileName = 'request.json'
  const fileNameBytes = new TextEncoder().encode(fileName)
  const fileContentBytes = new TextEncoder().encode(JSON.stringify(data, null, 2))
  const crc32 = calculateCrc32(fileContentBytes)

  const localFileHeader = createLocalFileHeader({
    crc32,
    fileNameBytes,
    uncompressedSize: fileContentBytes.length,
  })
  const centralDirectoryHeader = createCentralDirectoryHeader({
    crc32,
    fileNameBytes,
    localFileHeaderOffset: 0,
    uncompressedSize: fileContentBytes.length,
  })
  const endOfCentralDirectoryRecord = createEndOfCentralDirectoryRecord({
    centralDirectoryOffset: localFileHeader.length + fileContentBytes.length + fileNameBytes.length,
    centralDirectorySize: centralDirectoryHeader.length + fileNameBytes.length,
    totalEntries: 1,
  })

  const zipFileBytes = new Uint8Array(
    localFileHeader.length +
      fileNameBytes.length +
      fileContentBytes.length +
      centralDirectoryHeader.length +
      fileNameBytes.length +
      endOfCentralDirectoryRecord.length,
  )

  let offset = 0
  zipFileBytes.set(localFileHeader, offset)
  offset += localFileHeader.length
  zipFileBytes.set(fileNameBytes, offset)
  offset += fileNameBytes.length
  zipFileBytes.set(fileContentBytes, offset)
  offset += fileContentBytes.length
  zipFileBytes.set(centralDirectoryHeader, offset)
  offset += centralDirectoryHeader.length
  zipFileBytes.set(fileNameBytes, offset)
  offset += fileNameBytes.length
  zipFileBytes.set(endOfCentralDirectoryRecord, offset)

  c.header('Content-Type', 'application/zip')

  return c.body(zipFileBytes)
}

type ZipHeaderInput = {
  crc32: number
  fileNameBytes: Uint8Array
  uncompressedSize: number
}

type CentralDirectoryInput = ZipHeaderInput & {
  localFileHeaderOffset: number
}

type EndOfCentralDirectoryInput = {
  centralDirectoryOffset: number
  centralDirectorySize: number
  totalEntries: number
}

const createLocalFileHeader = ({ crc32, fileNameBytes, uncompressedSize }: ZipHeaderInput): Uint8Array => {
  const header = new Uint8Array(30)
  const view = new DataView(header.buffer)

  // Local file header signature
  view.setUint32(0, 0x04034b50, true)
  // Version needed to extract (2.0)
  view.setUint16(4, 20, true)
  // General purpose bit flag
  view.setUint16(6, 0, true)
  // Compression method (stored)
  view.setUint16(8, 0, true)
  // Last mod file time/date
  view.setUint16(10, 0, true)
  view.setUint16(12, 0, true)
  // CRC-32
  view.setUint32(14, crc32 >>> 0, true)
  // Compressed size
  view.setUint32(18, uncompressedSize, true)
  // Uncompressed size
  view.setUint32(22, uncompressedSize, true)
  // File name length
  view.setUint16(26, fileNameBytes.length, true)
  // Extra field length
  view.setUint16(28, 0, true)

  return header
}

const createCentralDirectoryHeader = ({
  crc32,
  fileNameBytes,
  localFileHeaderOffset,
  uncompressedSize,
}: CentralDirectoryInput): Uint8Array => {
  const header = new Uint8Array(46)
  const view = new DataView(header.buffer)

  // Central file header signature
  view.setUint32(0, 0x02014b50, true)
  // Version made by
  view.setUint16(4, 20, true)
  // Version needed to extract
  view.setUint16(6, 20, true)
  // General purpose bit flag
  view.setUint16(8, 0, true)
  // Compression method (stored)
  view.setUint16(10, 0, true)
  // Last mod file time/date
  view.setUint16(12, 0, true)
  view.setUint16(14, 0, true)
  // CRC-32
  view.setUint32(16, crc32 >>> 0, true)
  // Compressed size
  view.setUint32(20, uncompressedSize, true)
  // Uncompressed size
  view.setUint32(24, uncompressedSize, true)
  // File name length
  view.setUint16(28, fileNameBytes.length, true)
  // Extra field length
  view.setUint16(30, 0, true)
  // File comment length
  view.setUint16(32, 0, true)
  // Disk number start
  view.setUint16(34, 0, true)
  // Internal file attributes
  view.setUint16(36, 0, true)
  // External file attributes
  view.setUint32(38, 0, true)
  // Relative offset of local header
  view.setUint32(42, localFileHeaderOffset, true)

  return header
}

const createEndOfCentralDirectoryRecord = ({
  centralDirectoryOffset,
  centralDirectorySize,
  totalEntries,
}: EndOfCentralDirectoryInput): Uint8Array => {
  const record = new Uint8Array(22)
  const view = new DataView(record.buffer)

  // End of central dir signature
  view.setUint32(0, 0x06054b50, true)
  // Number of this disk
  view.setUint16(4, 0, true)
  // Number of the disk with the start of the central directory
  view.setUint16(6, 0, true)
  // Total entries in central directory on this disk
  view.setUint16(8, totalEntries, true)
  // Total entries in central directory
  view.setUint16(10, totalEntries, true)
  // Size of the central directory
  view.setUint32(12, centralDirectorySize, true)
  // Offset of start of central directory
  view.setUint32(16, centralDirectoryOffset, true)
  // ZIP file comment length
  view.setUint16(20, 0, true)

  return record
}

const createCrcTable = (): Uint32Array => {
  const table = new Uint32Array(256)

  for (let index = 0; index < 256; index += 1) {
    let crc = index

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) !== 0 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }

    table[index] = crc >>> 0
  }

  return table
}

const CRC_TABLE = createCrcTable()

const calculateCrc32 = (input: Uint8Array): number => {
  let crc = 0xffffffff

  for (const byte of input) {
    const tableIndex = (crc ^ byte) & 0xff
    const tableValue = CRC_TABLE[tableIndex] ?? 0
    crc = (crc >>> 8) ^ tableValue
  }

  return (crc ^ 0xffffffff) >>> 0
}
