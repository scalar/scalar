type Props = {
  href: string
  title: string
  children?: any
} & { [x: string]: any }

export default function LandingButton({ href, title, children, ...rest }: Props) {
  return (
    <a
      href={href}
      className="t-editor__button"
      {...rest}>
      {children ?? title}
    </a>
  )
}
