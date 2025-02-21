import { Command } from 'commander'
import kleur from 'kleur'

import { getFileOrUrl, useGivenFileOrConfiguration } from '../../utils'

export function ShareCommand() {
  const cmd = new Command('share')

  cmd.description('Share an OpenAPI file')
  cmd.argument('[file]', 'file to share')
  cmd.option('-t, --token <token>', 'pass a token to update an existing sandbox')
  cmd.action(async (fileArgument: string, { token }: { token?: string }) => {
    const file = useGivenFileOrConfiguration(fileArgument)

    const url = 'https://sandbox.scalar.com/api/share' + (token ? `?token=${token}` : '')

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: await getFileOrUrl(file),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const { id, token: newToken } = data

        console.log(kleur.bold().green('Your OpenAPI file is public.'))
        console.log()
        console.log(
          `${kleur.green('➜')} ${kleur.bold().white('API Reference:'.padEnd(14))} ${kleur.cyan(
            `https://sandbox.scalar.com/p/${id}`,
          )}`,
        )
        console.log(
          `${kleur.grey('➜')} ${kleur.bold().grey('Editor:'.padEnd(14))} ${kleur.cyan(
            `https://sandbox.scalar.com/e/${id}`,
          )}`,
        )
        console.log()
        console.log(
          `${kleur.grey('➜')} ${kleur.bold().grey('OpenAPI JSON:'.padEnd(14))} ${kleur.cyan(
            `https://sandbox.scalar.com/files/${id}/openapi.json`,
          )}`,
        )
        console.log(
          `${kleur.grey('➜')} ${kleur.bold().grey('OpenAPI YAML:'.padEnd(14))} ${kleur.cyan(
            `https://sandbox.scalar.com/files/${id}/openapi.yaml`,
          )}`,
        )
        console.log()
        console.log(kleur.white('Use the token to update the existing sandbox:'))
        console.log()
        console.log(
          `${kleur.grey('$')} ${kleur.bold().white(`scalar share --token=`)}${kleur.bold().cyan(`${newToken}`)} `,
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
