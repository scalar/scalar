type Props = {
  id: string
  alt: string
  lightSrc: string
  darkSrc: string
}

export default function GallerySlide({ id, alt, lightSrc, darkSrc }: Props) {
  return (
    <li id={id}>
      <img
        alt={alt}
        className="light-image"
        src={lightSrc}
      />
      <img
        alt={alt}
        className="dark-image"
        src={darkSrc}
      />
    </li>
  )
}
