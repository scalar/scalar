import fs from 'node:fs/promises'
import path from 'node:path'

import as from 'ansis'
import { Command } from 'commander'

import { getWorkspaceRoot } from '@/helpers'

import { emitConfig, emitEnums, emitModels } from './emit-python'
import { extractSchemas } from './extract-schemas'
import { transformSchemas } from './transform'

export const generatePythonConfig = new Command('generate-python-config')
  .description('Generate Python enums, models, and config from TypeScript Zod schemas')
  .action(async () => {
    const root = getWorkspaceRoot()
    const outputDir = path.join(root, 'integrations', 'python', 'scalar_api_reference')

    console.log(as.cyan('Extracting Zod schemas...'))
    const schemas = extractSchemas()

    console.log(as.cyan('Transforming to Python definitions...'))
    const { enums, models, config } = transformSchemas(
      schemas.apiReferenceFields,
      schemas.sourceFields,
      schemas.htmlRenderingFields,
    )

    console.log(as.cyan('Generating Python files...'))

    const enumsContent = emitEnums(enums)
    const modelsContent = emitModels(models)
    const configContent = emitConfig(config)

    await fs.writeFile(path.join(outputDir, 'enums.py'), enumsContent)
    console.log(as.green('  ✔ enums.py'))

    await fs.writeFile(path.join(outputDir, 'models.py'), modelsContent)
    console.log(as.green('  ✔ models.py'))

    await fs.writeFile(path.join(outputDir, 'config.py'), configContent)
    console.log(as.green('  ✔ config.py'))

    console.log(as.green('\nDone! Generated Python config files.'))
  })
