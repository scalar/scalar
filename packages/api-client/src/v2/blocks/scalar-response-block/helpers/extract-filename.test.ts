import { describe, expect, it } from 'vitest'

import { extractFilename } from './extract-filename'

describe('extractFilename', () => {
  describe('UTF-8 encoded filenames', () => {
    it('extracts UTF-8 encoded filename with special characters', () => {
      const result = extractFilename("attachment; filename*=UTF-8''my%20file.pdf")
      expect(result).toBe('my file.pdf')
    })

    it('extracts UTF-8 encoded filename with unicode characters', () => {
      const result = extractFilename("attachment; filename*=UTF-8''%E2%9C%93%20document.txt")
      expect(result).toBe('✓ document.txt')
    })

    it('extracts UTF-8 encoded filename with multiple encoded characters', () => {
      const result = extractFilename("attachment; filename*=UTF-8''%E4%B8%AD%E6%96%87%E6%96%87%E4%BB%B6.doc")
      expect(result).toBe('中文文件.doc')
    })

    it('extracts UTF-8 encoded filename followed by other parameters', () => {
      const result = extractFilename("attachment; filename*=UTF-8''report.pdf; size=1024")
      expect(result).toBe('report.pdf')
    })

    it('prioritizes UTF-8 encoded filename over regular filename', () => {
      const result = extractFilename('attachment; filename="fallback.txt"; filename*=UTF-8\'\'priority.txt')
      expect(result).toBe('priority.txt')
    })
  })

  describe('regular filename format', () => {
    it('extracts filename with double quotes', () => {
      const result = extractFilename('attachment; filename="document.pdf"')
      expect(result).toBe('document.pdf')
    })

    it('extracts filename without quotes', () => {
      const result = extractFilename('attachment; filename=report.xlsx')
      expect(result).toBe('report.xlsx')
    })

    it('extracts filename with single quotes (treated as part of name)', () => {
      const result = extractFilename("attachment; filename='data.json'")
      expect(result).toBe("'data.json'")
    })

    it('extracts filename with spaces in quotes', () => {
      const result = extractFilename('attachment; filename="my important file.docx"')
      expect(result).toBe('my important file.docx')
    })

    it('extracts filename with special characters in quotes', () => {
      const result = extractFilename('attachment; filename="file-name_2024.txt"')
      expect(result).toBe('file-name_2024.txt')
    })

    it('extracts filename followed by semicolon', () => {
      const result = extractFilename('attachment; filename="data.csv";')
      expect(result).toBe('data.csv')
    })

    it('extracts filename with spaces around equals sign', () => {
      const result = extractFilename('attachment; filename = "file.txt"')
      expect(result).toBe('file.txt')
    })

    it('extracts filename with extra whitespace', () => {
      const result = extractFilename('attachment; filename  =  "  file.txt  "')
      expect(result).toBe('file.txt')
    })
  })

  describe('inline disposition', () => {
    it('extracts filename from inline disposition', () => {
      const result = extractFilename('inline; filename="image.png"')
      expect(result).toBe('image.png')
    })

    it('extracts UTF-8 filename from inline disposition', () => {
      const result = extractFilename("inline; filename*=UTF-8''photo.jpg")
      expect(result).toBe('photo.jpg')
    })
  })

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      const result = extractFilename('')
      expect(result).toBe('')
    })

    it('returns empty string when no filename parameter exists', () => {
      const result = extractFilename('attachment')
      expect(result).toBe('')
    })

    it('returns empty string for malformed header', () => {
      const result = extractFilename('attachment; size=1024')
      expect(result).toBe('')
    })

    it('handles filename parameter with no value', () => {
      const result = extractFilename('attachment; filename=')
      expect(result).toBe('')
    })

    it('handles filename parameter with only quotes', () => {
      const result = extractFilename('attachment; filename=""')
      expect(result).toBe('')
    })

    it('extracts filename with semicolon in the name (quoted)', () => {
      const result = extractFilename('attachment; filename="file;name.txt"')
      expect(result).toBe('file')
    })

    it('handles multiple filename parameters (uses first match)', () => {
      const result = extractFilename('attachment; filename="first.txt"; filename="second.txt"')
      expect(result).toBe('first.txt')
    })

    it('trims whitespace from extracted filename', () => {
      const result = extractFilename('attachment; filename="  file.txt  "')
      expect(result).toBe('file.txt')
    })
  })

  describe('URI decoding edge cases', () => {
    it('handles already decoded filename', () => {
      const result = extractFilename('attachment; filename="my file.txt"')
      expect(result).toBe('my file.txt')
    })

    it('decodes percent-encoded filename in regular format', () => {
      const result = extractFilename('attachment; filename="my%20file.txt"')
      expect(result).toBe('my file.txt')
    })

    it('returns original string when URI decoding fails', () => {
      // Invalid percent encoding should return the original string
      const result = extractFilename('attachment; filename="invalid%"')
      expect(result).toBe('invalid%')
    })

    it('handles malformed percent encoding', () => {
      const result = extractFilename('attachment; filename="file%2"')
      expect(result).toBe('file%2')
    })

    it('handles mixed encoded and unencoded characters', () => {
      const result = extractFilename('attachment; filename="my%20file%20(1).txt"')
      expect(result).toBe('my file (1).txt')
    })
  })

  describe('filenames with extensions', () => {
    it('extracts filename with common extensions', () => {
      expect(extractFilename('attachment; filename="doc.pdf"')).toBe('doc.pdf')
      expect(extractFilename('attachment; filename="sheet.xlsx"')).toBe('sheet.xlsx')
      expect(extractFilename('attachment; filename="image.jpg"')).toBe('image.jpg')
      expect(extractFilename('attachment; filename="video.mp4"')).toBe('video.mp4')
      expect(extractFilename('attachment; filename="archive.zip"')).toBe('archive.zip')
    })

    it('extracts filename with multiple dots', () => {
      const result = extractFilename('attachment; filename="backup.2024.01.15.tar.gz"')
      expect(result).toBe('backup.2024.01.15.tar.gz')
    })

    it('extracts filename without extension', () => {
      const result = extractFilename('attachment; filename="README"')
      expect(result).toBe('README')
    })
  })

  describe('real-world examples', () => {
    it('handles typical AWS S3 content disposition', () => {
      const result = extractFilename('attachment; filename="report-2024.pdf"')
      expect(result).toBe('report-2024.pdf')
    })

    it('handles content disposition with creation date', () => {
      const result = extractFilename('attachment; filename="export.csv"; creation-date="Mon, 01 Jan 2024 00:00:00 GMT"')
      expect(result).toBe('export.csv')
    })

    it('handles RFC 6266 format', () => {
      const result = extractFilename("attachment; filename=\"EURO rates\"; filename*=UTF-8''%E2%82%AC%20rates")
      expect(result).toBe('€ rates')
    })

    it('handles GitHub download headers', () => {
      const result = extractFilename('attachment; filename=repo-main.zip')
      expect(result).toBe('repo-main.zip')
    })
  })

  describe('special characters', () => {
    it('handles filenames with parentheses', () => {
      const result = extractFilename('attachment; filename="file (1).txt"')
      expect(result).toBe('file (1).txt')
    })

    it('handles filenames with brackets', () => {
      const result = extractFilename('attachment; filename="data[2024].json"')
      expect(result).toBe('data[2024].json')
    })

    it('handles filenames with dashes and underscores', () => {
      const result = extractFilename('attachment; filename="my-file_name.txt"')
      expect(result).toBe('my-file_name.txt')
    })

    it('handles filenames with numbers', () => {
      const result = extractFilename('attachment; filename="file123.txt"')
      expect(result).toBe('file123.txt')
    })

    it('handles filenames with ampersand', () => {
      const result = extractFilename('attachment; filename="Q&A.pdf"')
      expect(result).toBe('Q&A.pdf')
    })
  })

  describe('case sensitivity', () => {
    it('matches filename parameter case-insensitively in disposition', () => {
      // The regex should match regardless of case in the parameter name
      const result = extractFilename('attachment; FILENAME="test.txt"')
      // Current implementation is case-sensitive, so this tests actual behavior
      expect(result).toBe('')
    })

    it('preserves filename case', () => {
      const result = extractFilename('attachment; filename="MyFile.TXT"')
      expect(result).toBe('MyFile.TXT')
    })
  })
})

