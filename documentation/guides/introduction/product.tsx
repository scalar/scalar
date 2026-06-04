import type { ReactNode } from 'react'

export type ProductFeature = {
  icon: ReactNode
  label: ReactNode
}

export type ProductImages = {
  alt: string
  lightSrc: string
  darkSrc: string
}

export type ProductLink = {
  href: string
  ariaLabel: string
  label: string
}

export type ProductProps = {
  reversed?: boolean
  label: string
  accentClass: string
  slug?: string
  title: string
  description: string
  features: ProductFeature[]
  images: ProductImages
  link: ProductLink
  sticker: ReactNode
}

export default function Product({
  reversed,
  label,
  accentClass,
  title,
  description,
  features,
  images,
  link,
  sticker,
}: ProductProps) {
  return (
    <div className={reversed ? 'product product-reversed' : 'product'}>
      <div className="product-copy">
        <span className={`font-bold ${accentClass}`}>{label}</span>
        <h2 className="t-editor__heading t-editor__standard-heading">{title}</h2>
        <p className="t-editor__paragraph">{description}</p>
        <ul
          className={`grid ${accentClass} gap-y-2 p-0`}
          style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {features.map((feature, index) => (
            <li
              key={index}
              className="flex items-center icon-text gap-3 font-medium min-h-8">
              {feature.icon}
              {feature.label}
            </li>
          ))}
        </ul>
        <a
          className="mt-3 t-editor__anchor"
          href={link.href}
          aria-label={link.ariaLabel}>
          {link.label}
        </a>
      </div>
      <div className="product-image">
        <div className="product-image-transform">
          <img
            alt={images.alt}
            className="light-image"
            src={images.lightSrc}
          />
          <img
            alt={images.alt}
            className="dark-image"
            src={images.darkSrc}
          />
        </div>
      </div>
      {sticker}
    </div>
  )
}
