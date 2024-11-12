import { stringify } from 'yaml'

// TODO: types
// convert to json?
// https://cloud.google.com/build/docs/build-config-file-schema#json

/**
 * Generate the appropriate cloudbuild.yaml file
 */
export default async function generateCloudBuild(serviceMap: any) {
  console.log('Generating Cloud Build')
  const containerImage = {
    name: 'gcr.io/cloud-builders/docker',
    id: 'build-base',
    args: [
      'build',
      '-t',
      'gcr.io/${_PROJECT_ID}/${_BASE_BUILDER}',
      '-f',
      './tooling/base-docker-builder/Dockerfile',
      '.',
    ],
  }
  const pushContainerImage = {
    name: 'gcr.io/cloud-builders/docker',
    id: 'push-base',
    waitFor: ['build-base'],
    args: ['push', 'gcr.io/${_PROJECT_ID}/${_BASE_BUILDER}'],
  }

  const cloudbuildSteps = [containerImage, pushContainerImage]

  serviceMap.forEach((service) => {
    const buildStep = {
      name: 'gcr.io/cloud-builders/docker',
      id: `build-${service.name}`,
      waitFor: ['push-base'],
      args: [
        'buildx',
        'build',
        '--build-arg',
        'BASE_IMAGE=gcr.io/${_PROJECT_ID}/${_BASE_BUILDER}',
        '-t',
        'gcr.io/${_PROJECT_ID}/' + `${service.cloudBuildName}`,
        '-f',
        service.dockerPath,
        '.',
      ],
    }
    cloudbuildSteps.push(buildStep)

    const pushStep = {
      name: 'gcr.io/cloud-builders/docker',
      id: `push-${service.name}`,
      waitFor: [`build-${service.name}`],
      args: ['push', 'gcr.io/${_PROJECT_ID}/' + `${service.cloudBuildName}`],
    }
    cloudbuildSteps.push(pushStep)

    const deployStep = {
      name: 'gcr.io/google.com/cloudsdktool/cloud-sdk',
      entrypoint: 'gcloud',
      waitFor: [`push-${service.name}`],
      args: [
        'run',
        'deploy',
        `${service.cloudBuildName}`,
        '--image=gcr.io/${_PROJECT_ID}/' + `${service.cloudBuildName}`,
        '--region=$_REGION',
        '--platform=managed',
        '--allow-unauthenticated',
        '--execution-environment=gen2',
        '--cpu=$_CPU',
        '--memory=$_MEMORY',
        '--service-account=$_SERVICE_ACCOUNT',
      ],
    }
    cloudbuildSteps.push(deployStep)
  })

  const options = {
    machineType: 'E2_HIGHCPU_8',
    logging: 'CLOUD_LOGGING_ONLY',
  }

  const cloudbuild = {
    steps: cloudbuildSteps,
    options: options,
  }

  const containerYaml = stringify(cloudbuild)
  console.log(containerYaml)

  return containerYaml

  // TODO: write to a file
  // TODO: overwrite the old file
}
