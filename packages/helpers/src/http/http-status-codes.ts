export type HttpStatusCode = {
  name: string
  url: string
  color: string
}

export type HttpStatusCodes = Record<string | number, HttpStatusCode>

export const httpStatusCodes: HttpStatusCodes = {
  100: {
    name: 'Continue',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/100',
    color: 'var(--scalar-color-blue)',
  },
  101: {
    name: 'Switching Protocols',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/101',
    color: 'var(--scalar-color-blue)',
  },
  102: {
    name: 'Processing',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/102',
    color: 'var(--scalar-color-blue)',
  },
  103: {
    name: 'Early Hints',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/103',
    color: 'var(--scalar-color-blue)',
  },
  200: {
    name: 'OK',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200',
    color: 'var(--scalar-color-green)',
  },
  201: {
    name: 'Created',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201',
    color: 'var(--scalar-color-green)',
  },
  202: {
    name: 'Accepted',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202',
    color: 'var(--scalar-color-green)',
  },
  203: {
    name: 'Non-Authoritative Information',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/203',
    color: 'var(--scalar-color-green)',
  },
  204: {
    name: 'No Content',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204',
    color: 'var(--scalar-color-green)',
  },
  205: {
    name: 'Reset Content',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/205',
    color: 'var(--scalar-color-green)',
  },
  206: {
    name: 'Partial Content',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206',
    color: 'var(--scalar-color-green)',
  },
  207: {
    name: 'Multi-Status',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/207',
    color: 'var(--scalar-color-green)',
  },
  208: {
    name: 'Already Reported',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/208',
    color: 'var(--scalar-color-green)',
  },
  226: {
    name: 'IM Used',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/226',
    color: 'var(--scalar-color-green)',
  },
  300: {
    name: 'Multiple Choices',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/300',
    color: 'var(--scalar-color-yellow)',
  },
  301: {
    name: 'Moved Permanently',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/301',
    color: 'var(--scalar-color-yellow)',
  },
  302: {
    name: 'Found',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302',
    color: 'var(--scalar-color-yellow)',
  },
  303: {
    name: 'See Other',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303',
    color: 'var(--scalar-color-yellow)',
  },
  304: {
    name: 'Not Modified',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304',
    color: 'var(--scalar-color-yellow)',
  },
  305: {
    name: 'Use Proxy',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/305',
    color: 'var(--scalar-color-yellow)',
  },
  306: {
    name: '(Unused)',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/306',
    color: 'var(--scalar-color-yellow)',
  },
  307: {
    name: 'Temporary Redirect',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307',
    color: 'var(--scalar-color-yellow)',
  },
  308: {
    name: 'Permanent Redirect',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308',
    color: 'var(--scalar-color-yellow)',
  },
  400: {
    name: 'Bad Request',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400',
    color: 'var(--scalar-color-red)',
  },
  401: {
    name: 'Unauthorized',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401',
    color: 'var(--scalar-color-red)',
  },
  402: {
    name: 'Payment Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402',
    color: 'var(--scalar-color-red)',
  },
  403: {
    name: 'Forbidden',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403',
    color: 'var(--scalar-color-red)',
  },
  404: {
    name: 'Not Found',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404',
    color: 'var(--scalar-color-red)',
  },
  405: {
    name: 'Method Not Allowed',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405',
    color: 'var(--scalar-color-red)',
  },
  406: {
    name: 'Not Acceptable',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406',
    color: 'var(--scalar-color-red)',
  },
  407: {
    name: 'Proxy Authentication Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/407',
    color: 'var(--scalar-color-red)',
  },
  408: {
    name: 'Request Timeout',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408',
    color: 'var(--scalar-color-red)',
  },
  409: {
    name: 'Conflict',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409',
    color: 'var(--scalar-color-red)',
  },
  410: {
    name: 'Gone',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410',
    color: 'var(--scalar-color-red)',
  },
  411: {
    name: 'Length Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411',
    color: 'var(--scalar-color-red)',
  },
  412: {
    name: 'Precondition Failed',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412',
    color: 'var(--scalar-color-red)',
  },
  413: {
    name: 'Content Too Large',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413',
    color: 'var(--scalar-color-red)',
  },
  414: {
    name: 'URI Too Long',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414',
    color: 'var(--scalar-color-red)',
  },
  415: {
    name: 'Unsupported Media Type',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415',
    color: 'var(--scalar-color-red)',
  },
  416: {
    name: 'Range Not Satisfiable',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416',
    color: 'var(--scalar-color-red)',
  },
  417: {
    name: 'Expectation Failed',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417',
    color: 'var(--scalar-color-red)',
  },
  418: {
    name: "I'm a teapot",
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418',
    color: 'var(--scalar-color-red)',
  },
  421: {
    name: 'Misdirected Request',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/421',
    color: 'var(--scalar-color-red)',
  },
  422: {
    name: 'Unprocessable Content',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422',
    color: 'var(--scalar-color-red)',
  },
  423: {
    name: 'Locked',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/423',
    color: 'var(--scalar-color-red)',
  },
  424: {
    name: 'Failed Dependency',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/424',
    color: 'var(--scalar-color-red)',
  },
  425: {
    name: 'Too Early',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/425',
    color: 'var(--scalar-color-red)',
  },
  426: {
    name: 'Upgrade Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426',
    color: 'var(--scalar-color-red)',
  },
  428: {
    name: 'Precondition Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/428',
    color: 'var(--scalar-color-red)',
  },
  429: {
    name: 'Too Many Requests',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429',
    color: 'var(--scalar-color-red)',
  },
  431: {
    name: 'Request Header Fields Too Large',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431',
    color: 'var(--scalar-color-red)',
  },
  451: {
    name: 'Unavailable For Legal Reasons',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451',
    color: 'var(--scalar-color-red)',
  },
  500: {
    name: 'Internal Server Error',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500',
    color: 'var(--scalar-color-red)',
  },
  501: {
    name: 'Not Implemented',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501',
    color: 'var(--scalar-color-red)',
  },
  502: {
    name: 'Bad Gateway',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502',
    color: 'var(--scalar-color-red)',
  },
  503: {
    name: 'Service Unavailable',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503',
    color: 'var(--scalar-color-red)',
  },
  504: {
    name: 'Gateway Timeout',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504',
    color: 'var(--scalar-color-red)',
  },
  505: {
    name: 'HTTP Version Not Supported',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505',
    color: 'var(--scalar-color-red)',
  },
  506: {
    name: 'Variant Also Negotiates',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/506',
    color: 'var(--scalar-color-red)',
  },
  507: {
    name: 'Insufficient Storage',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/507',
    color: 'var(--scalar-color-red)',
  },
  508: {
    name: 'Loop Detected',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508',
    color: 'var(--scalar-color-red)',
  },
  510: {
    name: 'Not Extended',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510',
    color: 'var(--scalar-color-red)',
  },
  511: {
    name: 'Network Authentication Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511',
    color: 'var(--scalar-color-red)',
  },
}
