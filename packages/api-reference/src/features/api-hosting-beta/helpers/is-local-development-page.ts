/** IPv4 loopback: the whole of 127.0.0.0/8, not only 127.0.0.1. */
const IPV4_LOOPBACK = /^127(?:\.\d{1,3}){3}$/

/**
 * Whether a page comes from a development server on this machine: `localhost` or a name under it
 * (browsers resolve every `*.localhost` to this machine), a loopback address, or `0.0.0.0`, over
 * http or https, on an explicit port. The API Hosting beta prompt mounts, opens and remembers itself
 * only on such pages, so it can never reach a page anyone else can open.
 *
 * It is stricter than `isLocalUrl`, which the localhost shell uses: that also counts the reserved
 * `.test`, `.example` and `.invalid` names, which can be internal sites that people other than
 * developers visit.
 *
 * The port is what tells a development server apart from an app shipped in a web view, whose users
 * are that app's customers rather than developers who could join. Those apps serve themselves on
 * localhost names without a port: Capacitor and Cordova on Android (`https://localhost`), Wails
 * (`http://wails.localhost`), Tauri (`http://tauri.localhost`) and older .NET BlazorWebView apps
 * (`https://0.0.0.0`). Development servers almost always name their port (Vite 5173, Next.js 3000,
 * uvicorn 8000 and so on); one served on port 80 or 443 does without the prompt, which is the safe
 * side to err on.
 *
 * @param page - The page's address; the current page when left out.
 */
export const isLocalDevelopmentPage = (
  { protocol, hostname, port }: Pick<Location, 'protocol' | 'hostname' | 'port'> = window.location,
): boolean => {
  if ((protocol !== 'http:' && protocol !== 'https:') || port === '') {
    return false
  }

  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    IPV4_LOOPBACK.test(hostname) ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0'
  )
}
