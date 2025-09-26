export const STATUS_CODES_COLORS = {
  100: {
    color: 'text-yellow',
  },
  200: {
    color: 'text-green',
  },
  202: {
    color: 'text-green',
  },
  300: {
    color: 'text-blue',
  },
  304: {
    color: 'text-blue',
  },
  400: {
    color: 'text-red',
  },
  401: {
    color: 'text-orange',
  },
  422: {
    color: 'text-yellow',
  },
  423: {
    color: 'text-purple',
  },
  505: {
    color: 'text-orange',
  },
} as const

export type StatusCode = keyof typeof STATUS_CODES_COLORS

export const getStatusCodeColor = (statusCode: number) => {
  const code = statusCode as StatusCode
  return (
    STATUS_CODES_COLORS[code] || {
      /** default color */
      color: 'text-grey',
    }
  )
}
