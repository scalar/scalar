import type { CodeMirrorLanguage } from '@scalar/use-codemirror'

export type MediaPreview = 'img' | 'img-w-alpha' | 'html'

export type MediaConfig = {
  preview?: MediaPreview
  raw?: boolean
  language?: CodeMirrorLanguage
  extension: string
}

/** Media Type (MIME Type) Definitions */
export const mediaTypes: { [type: string]: MediaConfig | undefined } = {
  'application/epub+zip': { extension: '.epub' },
  'application/gzip': { extension: '.gz' },
  'application/java-archive': { extension: '.jar' },
  'application/json': { extension: '.json', raw: true, language: 'json' },
  'application/ld+json': { extension: '.jsonld', raw: true, language: 'json' },
  'application/msword': { extension: '.doc' },
  'application/octet-stream': { extension: '.bin' },
  'application/ogg': { extension: '.ogx' },
  'application/pdf': { extension: '.pdf' },
  'application/rtf': { extension: '.rtf', raw: true },
  'application/vnd.amazon.ebook': { extension: '.azw' },
  'application/vnd.apple.installer+xml': {
    extension: '.mpkg',
    raw: true,
    language: 'xml',
  },
  'application/vnd.mozilla.xul+xml': {
    extension: '.xul',
    raw: true,
    language: 'xml',
  },
  'application/vnd.ms-excel': { extension: '.xls' },
  'application/vnd.ms-fontobject': { extension: '.eot' },
  'application/vnd.ms-powerpoint': { extension: '.ppt' },
  'application/vnd.oasis.opendocument.presentation': { extension: '.odp' },
  'application/vnd.oasis.opendocument.spreadsheet': { extension: '.ods' },
  'application/vnd.oasis.opendocument.text': { extension: '.odt' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    extension: '.pptx',
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    extension: '.xlsx',
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extension: '.docx',
  },
  'application/vnd.rar': { extension: '.rar' },
  'application/vnd.visio': { extension: '.vsd' },
  'application/x-7z-compressed': { extension: '.7z' },
  'application/x-abiword': { extension: '.abw' },
  'application/x-bzip': { extension: '.bz' },
  'application/x-bzip2': { extension: '.bz2' },
  'application/x-cdf': { extension: '.cda' },
  'application/x-csh': { extension: '.csh' },
  'application/x-freearc': { extension: '.arc' },
  'application/x-httpd-php': { extension: '.php', raw: true },
  'application/x-sh': { extension: '.sh', raw: true },
  'application/x-tar': { extension: '.tar' },
  'application/xhtml+xml': { extension: '.xhtml', raw: true, language: 'html' },
  'application/xml': { extension: '.xml', raw: true, language: 'xml' },
  'application/zip': { extension: '.zip' },
  'audio/aac': { extension: '.aac' },
  'audio/midi': { extension: '.midi' },
  'audio/mpeg': { extension: '.mp3' },
  'audio/ogg': { extension: '.oga' },
  'audio/wav': { extension: '.wav' },
  'audio/webm': { extension: '.weba' },
  'font/otf': { extension: '.otf' },
  'font/ttf': { extension: '.ttf' },
  'font/woff': { extension: '.woff' },
  'font/woff2': { extension: '.woff2' },
  'image/apng': { extension: '.apng', preview: 'img-w-alpha' },
  'image/avif': { extension: '.avif', preview: 'img' },
  'image/bmp': { extension: '.bmp', preview: 'img' },
  'image/gif': { extension: '.gif', preview: 'img-w-alpha' },
  'image/jpeg': { extension: '.jpg', preview: 'img' },
  'image/png': { extension: '.png', preview: 'img-w-alpha' },
  'image/svg+xml': {
    extension: '.svg',
    raw: true,
    language: 'xml',
    preview: 'img-w-alpha',
  },
  'image/tiff': { extension: '.tiff' },
  'image/vnd.microsoft.icon': { extension: '.ico', preview: 'img' },
  'image/webp': { extension: '.webp', preview: 'img-w-alpha' },
  'text/calendar': { extension: '.ics', raw: true },
  'text/css': { extension: '.css', raw: true, language: 'css' },
  'text/csv': { extension: '.csv', raw: true },
  'text/html': {
    extension: '.html',
    raw: true,
    language: 'html',
    preview: 'html',
  },
  'text/javascript': { extension: '.js', raw: true },
  'text/plain': { extension: '.txt', raw: true },
  'text/xml': { extension: '.xml', raw: true, language: 'xml' },
  'video/3gpp': { extension: '.3gp' },
  'audio/3gpp': { extension: '.3gp' },
  'video/3gpp2': { extension: '.3g2' },
  'audio/3gpp2': { extension: '.3g2' },
  'video/mp2t': { extension: '.ts' },
  'video/mp4': { extension: '.mp4' },
  'video/mpeg': { extension: '.mpeg' },
  'video/ogg': { extension: '.ogv' },
  'video/webm': { extension: '.webm' },
  'video/x-msvideo': { extension: '.avi' },
}

/** Media Types (MIME Types) that can be displayed as raw text */
export const textMediaTypes: string[] = Object.entries(mediaTypes)
  .filter(([, config]) => config?.raw)
  .map(([type]) => type)
