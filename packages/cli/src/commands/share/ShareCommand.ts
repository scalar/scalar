import { Command } from 'commander'
import kleur from 'kleur'

import { readFile, useGivenFileOrConfiguration } from '../../utils'

export function ShareCommand() {
  const cmd = new Command('share')

  cmd.description('Share an OpenAPI file')
  cmd.argument('[file]', 'file to share')
  cmd.action(async (fileArgument: string) => {
    const file = useGivenFileOrConfiguration(fileArgument)

    fetch('https://sandbox.scalar.com/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: readFile(file),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const { id } = data

        console.log(kleur.bold().green('Your OpenAPI file is public.'))
        console.log()
        console.log(
          `${kleur.green('➜')} ${kleur
            .bold()
            .white('API Reference:'.padEnd(14))} ${kleur.cyan(
            `https://sandbox.scalar.com/p/${id}`,
          )}`,
        )
        console.log(
          `${kleur.grey('➜')} ${kleur
            .bold()
            .grey('Editor:'.padEnd(14))} ${kleur.cyan(
            `https://sandbox.scalar.com/e/${id}`,
          )}`,
        )
        console.log()
        console.log(
          `${kleur.grey('➜')} ${kleur
            .bold()
            .grey('OpenAPI JSON:'.padEnd(14))} ${kleur.cyan(
            `https://sandbox.scalar.com/files/${id}/openapi.json`,
          )}`,
        )
        console.log(
          `${kleur.grey('➜')} ${kleur
            .bold()
            .grey('OpenAPI YAML:'.padEnd(14))} ${kleur.cyan(
            `https://sandbox.scalar.com/files/${id}/openapi.yaml`,
          )}`,
        )
        console.log()
      })
      .catch((error) => {
        console.error('Failed to share the file.')
        console.log()
        console.error('Error:', error)
        console.log()
        process.exit(1)
      })
  })

  return cmd
}
