import { describe, expect, it } from 'vitest'

import { extractFilename } from './extractAttachmentFilename'

describe('extractFileName', () => {
  it('should return empty filename when Content-Disposition is empty', () => {
    const result = extractFilename('')
    expect(result).toEqual('')
  })

  it('should extract filename from Content-Disposition with quotes', () => {
    const contentDisposition = 'attachment; filename="example.txt"'
    const result = extractFilename(contentDisposition)
    expect(result).toEqual('example.txt')
  })

  it('should extract filename from Content-Disposition without quotes', () => {
    const contentDisposition = 'attachment; filename=example.txt'
    const result = extractFilename(contentDisposition)
    expect(result).toEqual('example.txt')
  })

  it('should trim spaces around filename', () => {
    const contentDisposition = 'attachment; filename=   example.txt   '
    const result = extractFilename(contentDisposition)
    expect(result).toEqual('example.txt')
  })

  it('should extract filename from Content-Disposition with spaces', () => {
    const contentDisposition = 'attachment; filename="example 123.txt"'
    const result = extractFilename(contentDisposition)
    expect(result).toEqual('example 123.txt')
  })

  it('should return empty filename when filename is not present', () => {
    const contentDisposition = 'attachment'
    const result = extractFilename(contentDisposition)
    expect(result).toEqual('')
  })

  it('should handle filenames with special characters', () => {
    const contentDisposition = 'attachment; filename="file-with-#-characters.pdf"'
    const result = extractFilename(contentDisposition)
    expect(result).toEqual('file-with-#-characters.pdf')
  })

  it('should handle encoded filenames', () => {
    const contentDisposition = 'attachment; filename=%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B5.pdf'
    const result = extractFilename(contentDisposition)
    expect(result).toEqual('สวัสดี.pdf')
  })

  it('should give priority to encoded utf-8 filenames', () => {
    const contentDisposition = `attachment; filename=____________________28.02.2025.xlsx; filename*=UTF-8''%D0%98%D0%BD%D0%B4%D0%B8%D0%B2%D0%B8%D0%B4%D1%83%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9%D0%9E%D1%82%D1%87%D0%B5%D1%82_28.02.2025.xlsx`

    const result = extractFilename(contentDisposition)
    expect(result).toEqual('ИндивидуальныйОтчет_28.02.2025.xlsx')
  })
})
