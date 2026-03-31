#!/usr/bin/env node

/**
 * Analyze barrel files (index.ts) for the Vite 8 tree-shaking issue.
 * 
 * Issue: When a barrel file mixes:
 * 1. Own exports (import X; export const y = ...)
 * 2. Pure re-exports (export { z } from './z')
 * 
 * Rolldown puts the entire barrel into a shared chunk, including heavy
 * dependencies only one entry needs.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findIndexFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, dist, build, .turbo
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.turbo', '.git'].includes(entry.name)) {
        continue;
      }
      findIndexFiles(fullPath, results);
    } else if (entry.name === 'index.ts') {
      results.push(fullPath);
    }
  }
  
  return results;
}

async function analyzeBarrelFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let hasOwnExports = false;
  let hasReExports = false;
  let hasReExportAll = false;
  
  const ownExportPatterns = [
    /^export\s+(const|let|var|function|class|type|interface|enum)\s+/,
    /^export\s+default\s+/,
    /^export\s*\{[^}]+\}\s*$/,  // export { x, y } without 'from'
  ];
  
  const reExportPatterns = [
    /^export\s*\{[^}]+\}\s+from\s+['"`]/,  // export { x } from './x'
    /^export\s+\*\s+as\s+\w+\s+from\s+['"`]/,  // export * as x from './x'
  ];
  
  const reExportAllPattern = /^export\s+\*\s+from\s+['"`]/;  // export * from './x'
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }
    
    // Check for re-export all
    if (reExportAllPattern.test(trimmed)) {
      hasReExportAll = true;
      hasReExports = true;
      continue;
    }
    
    // Check for re-exports
    if (reExportPatterns.some(pattern => pattern.test(trimmed))) {
      hasReExports = true;
      continue;
    }
    
    // Check for own exports
    if (ownExportPatterns.some(pattern => pattern.test(trimmed))) {
      hasOwnExports = true;
      continue;
    }
    
    // Check for imports that might be used in own exports
    if (trimmed.startsWith('import ') && !trimmed.includes('import type')) {
      // This might indicate own exports (imports used in the file)
      // We'll mark this as a potential indicator
    }
  }
  
  return {
    filePath,
    hasOwnExports,
    hasReExports,
    hasReExportAll,
    hasIssue: hasOwnExports && hasReExports,
    lines: content.split('\n').length,
  };
}

async function main() {
  console.log('Analyzing barrel files for Vite 8 tree-shaking issue...\n');
  
  // Find all index.ts files
  const files = findIndexFiles('/workspace');
  
  console.log(`Found ${files.length} index.ts files\n`);
  
  const results = [];
  
  for (const file of files) {
    const result = await analyzeBarrelFile(file);
    results.push(result);
  }
  
  // Filter files with the issue
  const filesWithIssue = results.filter(r => r.hasIssue);
  const filesWithReExportAll = results.filter(r => r.hasReExportAll);
  
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total barrel files analyzed: ${results.length}`);
  console.log(`Files with mixed exports (THE ISSUE): ${filesWithIssue.length}`);
  console.log(`Files with export * from (also problematic): ${filesWithReExportAll.length}`);
  console.log('='.repeat(80));
  console.log();
  
  if (filesWithIssue.length > 0) {
    console.log('FILES WITH MIXED EXPORTS (own exports + re-exports):');
    console.log('-'.repeat(80));
    filesWithIssue.forEach((result, index) => {
      const relativePath = path.relative('/workspace', result.filePath);
      console.log(`${index + 1}. ${relativePath}`);
    });
    console.log();
  }
  
  if (filesWithReExportAll.length > 0) {
    console.log('FILES WITH EXPORT * FROM (re-export all):');
    console.log('-'.repeat(80));
    filesWithReExportAll.forEach((result, index) => {
      const relativePath = path.relative('/workspace', result.filePath);
      console.log(`${index + 1}. ${relativePath}`);
    });
    console.log();
  }
  
  // Write detailed results to a file
  const detailedResults = {
    summary: {
      totalFiles: results.length,
      filesWithMixedExports: filesWithIssue.length,
      filesWithReExportAll: filesWithReExportAll.length,
    },
    filesWithMixedExports: filesWithIssue.map(r => ({
      path: path.relative('/workspace', r.filePath),
      lines: r.lines,
    })),
    filesWithReExportAll: filesWithReExportAll.map(r => ({
      path: path.relative('/workspace', r.filePath),
      lines: r.lines,
    })),
  };
  
  fs.writeFileSync(
    '/workspace/barrel-file-analysis.json',
    JSON.stringify(detailedResults, null, 2)
  );
  
  console.log('Detailed results written to: barrel-file-analysis.json');
}

main().catch(console.error);
