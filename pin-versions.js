#!/usr/bin/env node
/**
 * Script to pin all dependencies to exact versions (remove ^ and ~)
 * This helps protect against supply chain attacks by ensuring exact versions are used.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');

console.log(`\n🔍 Scanning for package.json files with version ranges...\n`);

const changesByFile = new Map();
let totalChanges = 0;

// Recursively find all package.json files
function findPackageJsonFiles(dir, files = []) {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    
    // Skip node_modules, dist, .next, .output, target directories
    if (
      entry === 'node_modules' ||
      entry === 'dist' ||
      entry === '.next' ||
      entry === '.output' ||
      entry === 'target' ||
      entry === '.turbo' ||
      entry === '.nuxt'
    ) {
      continue;
    }
    
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      findPackageJsonFiles(fullPath, files);
    } else if (entry === 'package.json') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function pinVersion(version) {
  if (typeof version !== 'string') return version;
  
  // Skip workspace:*, catalog:*, npm:*, github:, git:, file:, link:, and exact versions
  if (
    version.startsWith('workspace:') ||
    version.startsWith('catalog:') ||
    version.startsWith('npm:') ||
    version.startsWith('github:') ||
    version.startsWith('git:') ||
    version.startsWith('file:') ||
    version.startsWith('link:') ||
    version.startsWith('http:') ||
    version.startsWith('https:') ||
    (!version.includes('^') && !version.includes('~'))
  ) {
    return version;
  }
  
  // Remove ^ and ~ prefixes
  return version.replace(/^[\^~]/, '');
}

function processPackageJson(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const pkg = JSON.parse(content);
  const changes = [];
  
  const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
  
  sections.forEach(section => {
    if (pkg[section]) {
      Object.keys(pkg[section]).forEach(dep => {
        const oldVersion = pkg[section][dep];
        const newVersion = pinVersion(oldVersion);
        
        if (oldVersion !== newVersion) {
          changes.push({ section, dep, oldVersion, newVersion });
          pkg[section][dep] = newVersion;
        }
      });
    }
  });
  
  // Also check engines
  if (pkg.engines) {
    Object.keys(pkg.engines).forEach(engine => {
      const oldVersion = pkg.engines[engine];
      const newVersion = pinVersion(oldVersion);
      
      if (oldVersion !== newVersion) {
        changes.push({ section: 'engines', dep: engine, oldVersion, newVersion });
        pkg.engines[engine] = newVersion;
      }
    });
  }
  
  if (changes.length > 0) {
    changesByFile.set(filePath, changes);
    totalChanges += changes.length;
    
    if (!DRY_RUN) {
      // Preserve original formatting as much as possible
      const newContent = JSON.stringify(pkg, null, 2) + '\n';
      writeFileSync(filePath, newContent, 'utf8');
    }
  }
  
  return changes.length;
}

function processWorkspaceYaml() {
  const workspaceYamlPath = resolve(process.cwd(), 'pnpm-workspace.yaml');
  const content = readFileSync(workspaceYamlPath, 'utf8');
  const lines = content.split('\n');
  const changes = [];
  let inCatalogs = false;
  let inCatalogSection = false;
  
  const newLines = lines.map((line, idx) => {
    const trimmed = line.trim();
    
    // Check if we're entering the catalogs section
    if (trimmed === 'catalogs:') {
      inCatalogs = true;
      return line;
    }
    
    // Check if we're in the catalog section (under '*:')
    if (inCatalogs && (trimmed === "'*':" || trimmed === '"*":' || trimmed === '*:')) {
      inCatalogSection = true;
      return line;
    }
    
    // Exit catalogs section when we hit a new top-level key (no indentation)
    if (inCatalogs && line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
      inCatalogs = false;
      inCatalogSection = false;
      return line;
    }
    
    // Process catalog entries (must be in catalog section and have proper indentation)
    if (inCatalogSection && line.includes(':') && (line.startsWith('    ') || line.startsWith('\t\t'))) {
      // Match lines like:    '@package/name': ^1.0.0
      const match = line.match(/^(\s+)['"]?([@\w\/-]+)['"]?:(.+)$/);
      if (match) {
        const [, indent, key, value] = match;
        const oldValue = value.trim();
        const newValue = pinVersion(oldValue);
        
        if (oldValue !== newValue) {
          changes.push({ key, oldValue, newValue });
          // Preserve original quote style
          const hasQuotes = line.includes(`'${key}'`) || line.includes(`"${key}"`);
          const quote = line.includes(`'${key}'`) ? "'" : '"';
          if (hasQuotes) {
            return `${indent}${quote}${key}${quote}: ${newValue}`;
          } else {
            return `${indent}${key}: ${newValue}`;
          }
        }
      }
    }
    
    return line;
  });
  
  if (changes.length > 0) {
    changesByFile.set(workspaceYamlPath, changes);
    totalChanges += changes.length;
    
    if (!DRY_RUN) {
      writeFileSync(workspaceYamlPath, newLines.join('\n'), 'utf8');
    }
  }
  
  return changes.length;
}

// Find and process all package.json files
const packageJsonFiles = findPackageJsonFiles(process.cwd());
packageJsonFiles.forEach(filePath => {
  processPackageJson(filePath);
});

// Process pnpm-workspace.yaml
processWorkspaceYaml();

// Report results
if (totalChanges === 0) {
  console.log('✅ No version ranges found. All dependencies are already pinned!\n');
} else {
  console.log(`📝 Found ${totalChanges} version ranges to pin:\n`);
  
  changesByFile.forEach((changes, filePath) => {
    const relativePath = filePath.replace(process.cwd() + '/', '');
    console.log(`\n📄 ${relativePath}`);
    
    changes.forEach(change => {
      if (change.section) {
        console.log(`   ${change.section}.${change.dep}: ${change.oldVersion} → ${change.newVersion}`);
      } else {
        console.log(`   ${change.key}: ${change.oldValue} → ${change.newValue}`);
      }
    });
  });
  
  if (DRY_RUN) {
    console.log(`\n⚠️  DRY RUN MODE - No files were modified`);
    console.log(`Run without --dry-run to apply changes\n`);
  } else {
    console.log(`\n✅ Successfully pinned ${totalChanges} dependencies!\n`);
  }
}

process.exit(0);
