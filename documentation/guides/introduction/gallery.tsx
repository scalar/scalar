import GallerySlide from './gallery-slide'

export default function Gallery() {
  return (
    <div className="slider">
      <button
        className="active"
        type="button"
        data-target="#slide-1">
        API Docs
      </button>
      <button
        type="button"
        data-target="#slide-2">
        API Registry
      </button>
      <button
        type="button"
        data-target="#slide-3">
        SDKs
      </button>
      <button
        type="button"
        data-target="#slide-4">
        API Client
      </button>
      <ul
        className="gallery container-full"
        id="gallery">
        <GallerySlide
          id="slide-1"
          alt="API References Animation"
          lightSrc="/app-docs-animated.svg"
          darkSrc="/app-docs-animated-dark.svg"
        />
        <GallerySlide
          id="slide-2"
          alt="API Registry Animation"
          lightSrc="/registry-animated.svg"
          darkSrc="/registry-animated-dark.svg"
        />
        <GallerySlide
          id="slide-3"
          alt="SDK Animation"
          lightSrc="/sdks-animated.svg"
          darkSrc="/sdks-animated-dark.svg"
        />
        <GallerySlide
          id="slide-4"
          alt="Client Animation"
          lightSrc="/api-client-animated.svg"
          darkSrc="/api-client-animated-dark.svg"
        />
      </ul>
    </div>
  )
}
