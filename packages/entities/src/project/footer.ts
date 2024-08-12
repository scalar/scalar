export const defaultFooter = `
<footer>
  <p>This documentation playground was created by Scalar. For help, questions or feedback don't hesitate to <a href="mailto:marc@scalar.com">email our support.</a></p>
  <br />
  <p>You can fully customize or delete this footer by simply navigating to the footer section of the "customize" button  within our header.</p>
  <br />
  <a target="_blank" href="https://scalar.com/#docs">Features</a>
  <a target="_blank" href="https://scalar.com/#docs">About</a>
  <a target="_blank" href="https://scalar.com/#pricing">Pricing</a>
  <br />
  <a target="_blank" href="https://scalar.com/privacy-policy">Privacy Policy</a>
  <a target="_blank" href="https://scalar.com/terms-and-conditions">Terms of Service</a>
  <a target="_blank" href="https://scalar.com/#pricing">Pricing</a>
  <br />
  <p>© ${new Date().getFullYear()} Scalar</p>
</footer>
`

export const defaultFooterCSS = `
footer {
  padding: 100px 50px 75px;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--scalar-border-color);
  font-size: var(--scalar-paragraph);
  line-height: 1.45
}
footer * {
  max-width: 520px;
}
footer p {
  margin-bottom: 25px;
}
footer a {
  width: fit-content;
  color:var(--scalar-color-accent)
}
footer a:hover {
  cursor: pointer;
  text-decoration: underline;
}
@media (max-width: 720px) {
  footer {
    padding: 100px 24px 75px;
  }
}
`
