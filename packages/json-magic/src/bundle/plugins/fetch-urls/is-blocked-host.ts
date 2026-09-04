import { lookup } from 'node:dns/promises'
import { BlockList, isIP, isIPv4 } from 'node:net'

/**
 * Address ranges that must never be reachable through a bundled `$ref`.
 *
 * Covers loopback, private, link-local (including the cloud metadata endpoint 169.254.169.254),
 * carrier-grade NAT, and their IPv6 equivalents. The IPv6 transition ranges (6to4, NAT64, Teredo,
 * IPv4-compatible) are blocked wholesale so an address like 64:ff9b::a9fe:a9fe cannot smuggle a
 * private IPv4 destination past the checks. Those ranges are deprecated or rarely used for real API
 * hosting, so blocking them outright is a safe trade.
 */
const blockList = new BlockList()

blockList.addAddress('0.0.0.0', 'ipv4')
blockList.addSubnet('127.0.0.0', 8, 'ipv4')
blockList.addSubnet('10.0.0.0', 8, 'ipv4')
blockList.addSubnet('172.16.0.0', 12, 'ipv4')
blockList.addSubnet('192.168.0.0', 16, 'ipv4')
blockList.addSubnet('169.254.0.0', 16, 'ipv4')
blockList.addSubnet('100.64.0.0', 10, 'ipv4')

blockList.addSubnet('::', 96, 'ipv6') // unspecified, loopback (::1), and deprecated IPv4-compatible
blockList.addSubnet('fe80::', 10, 'ipv6') // link-local
blockList.addSubnet('fc00::', 7, 'ipv6') // unique local
blockList.addSubnet('2002::', 16, 'ipv6') // 6to4
blockList.addSubnet('64:ff9b::', 96, 'ipv6') // NAT64
blockList.addSubnet('2001::', 32, 'ipv6') // Teredo

/**
 * Checks whether a single IP address falls inside a blocked range.
 */
const ipIsBlocked = (ip: string): boolean => {
  const family = isIP(ip)

  if (family === 0) {
    // Not a valid IP, block to be safe
    return true
  }

  if (blockList.check(ip, family === 4 ? 'ipv4' : 'ipv6')) {
    return true
  }

  // Normalize an IPv4-mapped IPv6 address (::ffff:x.x.x.x, in dotted or hex form) and re-check it
  // against the IPv4 rules, since it targets the embedded IPv4 destination.
  const dotted = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i)

  if (dotted && isIPv4(dotted[1]) && blockList.check(dotted[1], 'ipv4')) {
    return true
  }

  const hex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i)

  if (hex) {
    const high = Number.parseInt(hex[1], 16)
    const low = Number.parseInt(hex[2], 16)
    const mapped = `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`

    if (blockList.check(mapped, 'ipv4')) {
      return true
    }
  }

  return false
}

/**
 * Reports whether a hostname resolves to a private, loopback, link-local, or otherwise internal
 * address that a bundled `$ref` should not be allowed to reach.
 *
 * Literal IPs are checked directly. Hostnames are resolved via DNS and every returned address is
 * checked, so a name that points at an internal IP is rejected. A host that cannot be resolved is
 * treated as blocked.
 *
 * This lives in a Node-only module because it depends on `node:dns` and `node:net`. Load it with a
 * dynamic import so the browser build of the fetch plugin stays free of Node built-ins.
 *
 * @param hostname - The hostname or IP (brackets around an IPv6 literal are tolerated).
 */
export const isBlockedHost = async (hostname: string): Promise<boolean> => {
  const host = hostname.replace(/^\[/, '').replace(/\]$/, '')

  if (isIP(host)) {
    return ipIsBlocked(host)
  }

  try {
    const addresses = await lookup(host, { all: true })

    return addresses.some(({ address }) => ipIsBlocked(address))
  } catch {
    // Block when the host cannot be resolved
    return true
  }
}
