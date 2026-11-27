import { execFileSync, spawnSync } from 'node:child_process'
import { join } from 'node:path'

import { Command } from 'commander'

export const updatePlaywrightDocker = new Command('update-playwright-docker')
  .description('Publish missing Playwright Docker images for the selected release tag')
  .action((): void => {
    const directory = import.meta.dirname
    const tag = execFileSync('bash', [join(directory, 'read-release-tag.sh')], { encoding: 'utf8' }).trim()
    const missing = execFileSync('sh', [join(directory, 'missing-release-images.sh'), tag], { encoding: 'utf8' }).trim()
    if (!missing) {
      console.log(`Both Playwright images already have tag ${tag}.`)
      return
    }

    const [version] = tag.split('-')
    const builder = 'scalar-multiarch'
    // Reuse a container-driver builder so amd64 and arm64 can publish as one manifest.
    const { status } = spawnSync('docker', ['buildx', 'inspect', builder], { stdio: 'ignore' })
    if (status !== 0) {
      execFileSync('docker', ['buildx', 'create', '--name', builder, '--driver', 'docker-container', '--bootstrap'], {
        stdio: 'inherit',
      })
    }

    const missingRepositories = missing.split('\n')
    for (const [repository, dockerfile] of [
      ['playwright', 'Dockerfile'],
      ['playwright-runner', 'DockerfileRunner'],
    ]) {
      if (missingRepositories.includes(repository)) {
        execFileSync(
          'docker',
          [
            'buildx',
            'build',
            '--builder',
            builder,
            '--platform',
            'linux/amd64,linux/arm64',
            '--file',
            join(directory, dockerfile),
            '--build-arg',
            `PLAYWRIGHT_VERSION=${version}`,
            '--tag',
            `scalarapi/${repository}:${tag}`,
            '--push',
            directory,
          ],
          { stdio: 'inherit' },
        )
      }
    }
  })
