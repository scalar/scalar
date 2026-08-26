import { Command } from 'commander'

import { runCommand } from '@/helpers'

export const updatePlaywrightDocker = new Command('update-playwright-docker')
  .description('Update the docker image to the latest playwright')
  .action(async () => {
    const version = '1.62.1'

    // The runner image runs on linux/amd64 CI runners and is also launched with
    // `--platform linux/amd64` locally, so the published image must contain amd64.
    // A plain `docker build` only produces the host architecture, which silently
    // ships an arm64-only image when the release is cut from an Apple Silicon
    // machine and breaks CI. Build both architectures with buildx instead.
    const platforms = 'linux/amd64,linux/arm64'

    // Multi-platform builds need a container-driver builder; the default `docker`
    // driver can only build a single platform. Create it once, then reuse it.
    const builder = 'scalar-multiarch'
    await runCommand(
      `docker buildx inspect ${builder} > /dev/null 2>&1 || docker buildx create --name ${builder} --driver docker-container --bootstrap`,
    )

    // `--push` publishes the multi-arch manifest directly, so no separate
    // `docker push` step is needed.
    await runCommand(
      `docker buildx build --builder ${builder} --platform ${platforms} --build-arg PLAYWRIGHT_VERSION=${version} -t "scalarapi/playwright:${version}" --push ${import.meta.dirname}`,
    )
    await runCommand(
      `docker buildx build --builder ${builder} --platform ${platforms} -f ${import.meta.dirname}/DockerfileRunner --build-arg PLAYWRIGHT_VERSION=${version} -t "scalarapi/playwright-runner:${version}" --push ${import.meta.dirname}`,
    )

    process.exit()
  })
