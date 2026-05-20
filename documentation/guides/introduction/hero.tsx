import LandingButton from './landing-button'
import Sticker from './sticker'

export default function Hero() {
  return (
    <div className="flex flex-col gap-3 hero small-test">
      <h2
        id="introduction"
        className="text-balance t-editor__heading">
        Industry leading Developer Docs, SDKs & API Registry
      </h2>
      <p className="t-editor__paragraph">Purpose-built for the OpenAPI™ standard</p>
      <div className="flex gap-2">
        <LandingButton
          title="Get Started"
          href="https://dashboard.scalar.com/register"
        />
        <LandingButton
          title="Book a Demo"
          href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a"
          target="_blank"
        />
      </div>
      <div className="stickers">
        <Sticker
          className="sticker-5"
          src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/SiTCkdsfi2287iQBEGzN2.svg"
        />
        <Sticker
          className="sticker-1"
          src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/JXS6tZ4EbKIkeGpjP6QKc.svg"
        />
        <Sticker
          className="sticker-6"
          src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/sjRzU-qEfO5Y89jmLMyaF.svg"
        />
        <Sticker
          className="sticker-7"
          src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/-dJduqbPTJP5xwDRhB5VS.svg"
        />
      </div>
    </div>
  )
}
