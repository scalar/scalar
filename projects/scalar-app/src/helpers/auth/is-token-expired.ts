import { jwtDecode } from 'jwt-decode'

/** Check if the token is expired or will expire in the next 60s */
export const isTokenExpired = (
  token: string,
  /** current current time in unix milliseconds */
  current: number = Date.now(),
) => {
  try {
    const data = jwtDecode(token)
    const exp = data.exp ?? 0

    // We provide a little buffer in the event the refresh call takes longer than
    // expected or the interval needs to be fired a second time due to navigator.lock
    return exp < Math.floor(current / 1000) + 25
  } catch {
    return true
  }
}
