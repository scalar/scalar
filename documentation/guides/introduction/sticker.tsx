import InlineSvg from './inline-svg'

type StickerProps = {
  className: string
  src: string
}

export default function Sticker({ className, src }: StickerProps) {
  return (
    <div className={`draggable ${className}`}>
      <InlineSvg src={src} />
    </div>
  )
}
