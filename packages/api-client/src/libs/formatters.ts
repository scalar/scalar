/**
 * Formats bytes to a more readable format
 *
 * @see https://stackoverflow.com/a/18650828/1624255
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) {
    return '0 Bytes'
  }

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${sizes[i]}`
}

/**
 * Formats milliseconds to seconds and appends an "s" if more than one second
 * else returns ms appended to the number
 */
export const formatMs = (ms: number, decimals = 2): string => {
  if (ms > 1000) {
    return (ms / 1000).toFixed(decimals) + 's'
  }
  return ms + 'ms'
}
