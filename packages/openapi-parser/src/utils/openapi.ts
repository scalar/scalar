import type {
  AnyApiDefinitionFormat,
  AnyObject,
  DetailsResult,
  Filesystem,
  ThrowOnErrorOption,
} from '../types'
import { dereference } from './dereference'
import { details } from './details'
import { filter } from './filter'
import { getEntrypoint } from './getEntrypoint'
import { type LoadPlugin, load } from './load'
import { toJson } from './toJson'
import { toYaml } from './toYaml'
import { upgrade } from './upgrade'
import { validate } from './validate'
import { workThroughQueue } from './workThroughQueue'

/**
 * A queuable action for the pipeline
 */
export type Action = {
  action:
    | typeof load
    | typeof upgrade
    | typeof filter
    | typeof dereference
    | typeof validate
  options?: AnyObject
}

/**
 * A queue of tasks to run on an OpenAPI specification
 */
export type OldQueue = {
  specification: AnyApiDefinitionFormat
  tasks: Action[]
}

/**
 * Creates a new pipeline
 */
export function openapi(globalOptions?: ThrowOnErrorOption) {
  return {
    load: (
      specification: AnyApiDefinitionFormat,
      options?: {
        plugins?: LoadPlugin[]
      },
    ) =>
      loadAction(specification, {
        ...(globalOptions ?? {}),
        ...(options ?? {}),
      }),
  }
}

/**
 * Load an OpenAPI specification.
 *
 * Example: await openapi().load({ openapi: '3.0.0' })
 */
function loadAction(
  specification: AnyApiDefinitionFormat,
  options?: {
    throwOnError?: boolean
    plugins?: LoadPlugin[]
  },
) {
  const queue: OldQueue = {
    specification: specification,
    tasks: [
      {
        action: load,
        options: {
          plugins: options?.plugins,
        },
      },
    ],
  }

  return {
    get: () => getAction(queue),
    files: () => filesAction(queue),
    details: () => detailsAction(queue),
    filter: (callback: (Specification: AnyObject) => boolean) =>
      filterAction(queue, callback, {
        throwOnError: options?.throwOnError,
      }),
    upgrade: () =>
      upgradeAction(queue, {
        throwOnError: options?.throwOnError,
      }),
    validate: (validateOptions?: ThrowOnErrorOption) =>
      validateAction(queue, {
        throwOnError: validateOptions?.throwOnError ?? options?.throwOnError,
      }),
    dereference: (dereferenceOptions?: ThrowOnErrorOption) =>
      dereferenceAction(queue, {
        ...(options ?? {}),
        ...(dereferenceOptions ?? {}),
      }),
    toJson: () => toJsonAction(queue),
    toYaml: () => toYamlAction(queue),
  }
}

/**
 * Upgrade an OpenAPI specification.
 */
function upgradeAction(queue: OldQueue, options?: ThrowOnErrorOption) {
  queue.tasks.push({
    action: upgrade,
  })

  return {
    get: () => getAction(queue),
    files: () => filesAction(queue),
    details: () => detailsAction(queue),
    filter: (callback: (Specification: AnyObject) => boolean) =>
      filterAction(queue, callback, {
        throwOnError: options?.throwOnError,
      }),
    validate: (validateOptions?: ThrowOnErrorOption) =>
      validateAction(queue, {
        throwOnError: validateOptions?.throwOnError ?? options?.throwOnError,
      }),
    dereference: (dereferenceOptions?: ThrowOnErrorOption) =>
      dereferenceAction(queue, {
        ...(options ?? {}),
        ...(dereferenceOptions ?? {}),
      }),
    toJson: () => toJsonAction(queue),
    toYaml: () => toYamlAction(queue),
  }
}

/**
 * Validate an OpenAPI specification.
 */
function validateAction(queue: OldQueue, options?: ThrowOnErrorOption) {
  queue.tasks.push({
    action: validate,
    options: {
      throwOnError: options?.throwOnError,
    },
  })

  return {
    filter: (callback: (Specification: AnyObject) => boolean) =>
      filterAction(queue, callback, {
        throwOnError: options?.throwOnError,
      }),
    get: () => getAction(queue),
    files: () => filesAction(queue),
    details: () => detailsAction(queue),
    dereference: (dereferenceOptions?: ThrowOnErrorOption) =>
      dereferenceAction(queue, {
        ...(options ?? {}),
        ...(dereferenceOptions ?? {}),
      }),
    toJson: () => toJsonAction(queue),
    toYaml: () => toYamlAction(queue),
  }
}

/**
 * Resolve references in an OpenAPI specification.
 */
function dereferenceAction(queue: OldQueue, options?: ThrowOnErrorOption) {
  queue.tasks.push({
    action: dereference,
    options: {
      throwOnError: options?.throwOnError,
    },
  })

  return {
    get: () => getAction(queue),
    files: () => filesAction(queue),
    filter: (callback: (Specification: AnyObject) => boolean) =>
      filterAction(queue, callback, {
        throwOnError: options?.throwOnError,
      }),
    toJson: () => toJsonAction(queue),
    toYaml: () => toYamlAction(queue),
  }
}

/**
 * Remove parts of an OpenAPI specification with the given callback.
 */
function filterAction(
  queue: OldQueue,
  callback: (specification: AnyApiDefinitionFormat) => boolean,
  options?: ThrowOnErrorOption,
) {
  queue.tasks.push({
    action: filter,
    options: callback,
  })

  return {
    get: () => getAction(queue),
    files: () => filesAction(queue),
    details: () => detailsAction(queue),
    filter: () => filterAction(queue, callback, options),
    upgrade: () => upgradeAction(queue, options),
    validate: (validateOptions?: ThrowOnErrorOption) =>
      validateAction(queue, {
        throwOnError: validateOptions?.throwOnError ?? options?.throwOnError,
      }),
    dereference: (dereferenceOptions?: ThrowOnErrorOption) =>
      dereferenceAction(queue, {
        ...(options ?? {}),
        ...(dereferenceOptions ?? {}),
      }),
    toJson: () => toJsonAction(queue),
    toYaml: () => toYamlAction(queue),
  }
}

async function getAction(queue: OldQueue) {
  const result = await workThroughQueue(queue)

  // If specification is not defined, return the entrypoint specification
  if (result.specification === undefined) {
    result.specification = getEntrypoint(result.filesystem).specification
  }

  return result
}

async function filesAction(queue: OldQueue): Promise<Filesystem> {
  const { filesystem } = await workThroughQueue(queue)

  return filesystem
}

async function detailsAction(queue: OldQueue): Promise<DetailsResult> {
  const { filesystem } = await workThroughQueue(queue)

  return details(getEntrypoint(filesystem).specification)
}

async function toJsonAction(queue: OldQueue): Promise<string> {
  const { filesystem } = await workThroughQueue(queue)

  return toJson(getEntrypoint(filesystem).specification)
}

async function toYamlAction(queue: OldQueue): Promise<string> {
  const { filesystem } = await workThroughQueue(queue)

  return toYaml(getEntrypoint(filesystem).specification)
}
