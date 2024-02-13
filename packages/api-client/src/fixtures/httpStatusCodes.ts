export type HttpStatusCode = {
  name: string
  url: string
}

export type HttpStatusCodes = Record<string, HttpStatusCode>

export const httpStatusCodes: HttpStatusCodes = {
  100: {
    name: 'Continue',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/100',
  },
  101: {
    name: 'Switching Protocols',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/101',
  },
  102: {
    name: 'Processing',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/102',
  },
  103: {
    name: 'Early Hints',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/103',
  },
  200: {
    name: 'OK',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200',
  },
  201: {
    name: 'Created',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201',
  },
  202: {
    name: 'Accepted',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202',
  },
  203: {
    name: 'Non-Authoritative Information',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/203',
  },
  204: {
    name: 'No Content',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204',
  },
  205: {
    name: 'Reset Content',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/205',
  },
  206: {
    name: 'Partial Content',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206',
  },
  207: {
    name: 'Multi-Status',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/207',
  },
  208: {
    name: 'Already Reported',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/208',
  },
  226: {
    name: 'IM Used',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/226',
  },
  300: {
    name: 'Multiple Choices',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/300',
  },
  301: {
    name: 'Moved Permanently',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/301',
  },
  302: {
    name: 'Found',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302',
  },
  303: {
    name: 'See Other',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303',
  },
  304: {
    name: 'Not Modified',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304',
  },
  305: {
    name: 'Use Proxy',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/305',
  },
  306: {
    name: '(Unused)',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/306',
  },
  307: {
    name: 'Temporary Redirect',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307',
  },
  308: {
    name: 'Permanent Redirect',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308',
  },
  400: {
    name: 'Bad Request',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400',
  },
  401: {
    name: 'Unauthorized',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401',
  },
  402: {
    name: 'Payment Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402',
  },
  403: {
    name: 'Forbidden',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403',
  },
  404: {
    name: 'Not Found',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404',
  },
  405: {
    name: 'Method Not Allowed',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405',
  },
  406: {
    name: 'Not Acceptable',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406',
  },
  407: {
    name: 'Proxy Authentication Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/407',
  },
  408: {
    name: 'Request Timeout',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408',
  },
  409: {
    name: 'Conflict',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409',
  },
  410: {
    name: 'Gone',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410',
  },
  411: {
    name: 'Length Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411',
  },
  412: {
    name: 'Precondition Failed',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412',
  },
  413: {
    name: 'Content Too Large',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413',
  },
  414: {
    name: 'URI Too Long',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414',
  },
  415: {
    name: 'Unsupported Media Type',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415',
  },
  416: {
    name: 'Range Not Satisfiable',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416',
  },
  417: {
    name: 'Expectation Failed',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417',
  },
  421: {
    name: 'Misdirected Request',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/421',
  },
  422: {
    name: 'Unprocessable Content',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422',
  },
  423: {
    name: 'Locked',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/423',
  },
  424: {
    name: 'Failed Dependency',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/424',
  },
  425: {
    name: 'Too Early',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/425',
  },
  426: {
    name: 'Upgrade Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426',
  },
  428: {
    name: 'Precondition Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/428',
  },
  429: {
    name: 'Too Many Requests',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429',
  },
  431: {
    name: 'Request Header Fields Too Large',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431',
  },
  451: {
    name: 'Unavailable For Legal Reasons',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451',
  },
  500: {
    name: 'Internal Server Error',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500',
  },
  501: {
    name: 'Not Implemented',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501',
  },
  502: {
    name: 'Bad Gateway',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502',
  },
  503: {
    name: 'Service Unavailable',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503',
  },
  504: {
    name: 'Gateway Timeout',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504',
  },
  505: {
    name: 'HTTP Version Not Supported',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505',
  },
  506: {
    name: 'Variant Also Negotiates',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/506',
  },
  507: {
    name: 'Insufficient Storage',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/507',
  },
  508: {
    name: 'Loop Detected',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508',
  },
  510: {
    name: 'Not Extended',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510',
  },
  511: {
    name: 'Network Authentication Required',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511',
  },
}
