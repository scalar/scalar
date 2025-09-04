import { runCommand } from '@/helpers'
import { latestVersion } from '@/helpers/npm-version'
import { Command } from 'commander'

export const updatePlaywrightDocker = new Command('update-playwright-docker')
  .description('Update the docker image to the latest playwright')
  .action(async () => {
    const { version } = await latestVersion('playwright', '1.55.0')

    await runCommand(
      `docker build -t "scalarapi/playwright:${version}" --build-arg PLAYWRIGHT_VERSION=${version} ${import.meta.dirname}`,
    )
    await runCommand(`docker push "scalarapi/playwright:${version}"`)

    process.exit()
  })
