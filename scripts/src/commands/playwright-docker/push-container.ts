import { Command } from 'commander'

import { runCommand } from '@/helpers'

export const updatePlaywrightDocker = new Command('update-playwright-docker')
  .description('Update the docker image to the latest playwright')
  .action(async () => {
    const version = '1.56.0'

    await runCommand(
      `docker build -t "scalarapi/playwright:${version}" --build-arg PLAYWRIGHT_VERSION=${version} ${import.meta.dirname}`,
    )
    await runCommand(
      `docker build -t "scalarapi/playwright-runner:${version}" -f ${import.meta.dirname}/DockerfileRunner --build-arg PLAYWRIGHT_VERSION=${version} ${import.meta.dirname}`,
    )
    await runCommand(`docker push "scalarapi/playwright:${version}"`)
    await runCommand(`docker push "scalarapi/playwright-runner:${version}"`)

    process.exit()
  })
