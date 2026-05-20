import { useEffect, useState } from 'react'

type Props = {
  src: string
  title?: string
} & { [x: string]: any }

export default function InlineSvg({ src, title, ...rest }: Props) {
  const [svg, setSvg] = useState<{ attrs: Record<string, string>; innerHTML: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    setSvg(null)

    fetch(src)
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((text) => {
        if (cancelled || typeof document === 'undefined') {
          return
        }
        const el = new DOMParser().parseFromString(text, 'image/svg+xml').querySelector('svg')
        if (!el) {
          return
        }

        const attrs: Record<string, string> = {}
        for (const a of Array.from(el.attributes)) {
          attrs[a.name === 'class' ? 'className' : a.name] = a.value
        }
        setSvg({ attrs, innerHTML: el.innerHTML })
      })
      .catch(() => {
        // Keep img fallback when fetch or parse fails
      })

    return () => {
      cancelled = true
    }
  }, [src])

  if (svg) {
    const { className, ...svgAttrs } = svg.attrs
    return (
      <svg
        {...svgAttrs}
        className={className}
        {...rest}
        dangerouslySetInnerHTML={{ __html: svg.innerHTML }}
      />
    )
  }

  return (
    <img
      src={src}
      alt={title ?? ''}
      style={{ objectFit: 'contain' }}
      onError={(e) => {
        e.currentTarget.style.visibility = 'hidden'
      }}
      {...rest}
    />
  )
}
