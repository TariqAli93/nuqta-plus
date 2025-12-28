#!/usr/bin/env node

/**
 * Unused Code Analyzer for Vue/Nuxt Projects
 * Finds unused variables, components, composables, and files
 */

import fs from 'fs';
import path from 'path';

// Configuration
const config = {
  rootDir: process.cwd(),
  extensions: ['.vue', '.js', '.ts', '.jsx', '.tsx'],
  excludeDirs: ['node_modules', '.nuxt', '.output', 'dist', '.git'],
  componentsDir: 'frontend/src/components',
  composablesDir: 'frontend/src/composables',
  pagesDir: 'frontend/src/views',
  layoutsDir: 'frontend/src/layouts',
};

// Results storage
const results = {
  unusedComponents: [],
  unusedComposables: [],
  unusedVariables: [],
  unusedFiles: [],
  componentUsage: new Map(),
  composableUsage: new Map(),
  fileUsage: new Map(),
};

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!config.excludeDirs.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (config.extensions.includes(ext)) {
        fileList.push(path.normalize(filePath));
      }
    }
  }
  
  return fileList;
}

/**
 * Extract component name from file path
 */
function getComponentName(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  // Convert kebab-case or snake_case to PascalCase
  return basename
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Extract composable name from file path
 */
function getComposableName(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  // Composables usually start with 'use'
  if (basename.startsWith('use')) {
    return basename;
  }
  return 'use' + basename.charAt(0).toUpperCase() + basename.slice(1);
}

/**
 * Find unused variables in a file
 */
function findUnusedVariables(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const unusedVars = [];
  
  // Match variable declarations (const, let, var)
  const varRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
  let match;
  
  while ((match = varRegex.exec(content)) !== null) {
    const varName = match[1];
    
    // Skip common patterns that are intentionally unused
    if (varName.startsWith('_') || varName === 'props' || varName === 'emit') {
      continue;
    }
    
    // Count occurrences (excluding the declaration)
    const declarationIndex = match.index;
    const afterDeclaration = content.substring(declarationIndex + match[0].length);
    
    const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
    const usagesAfter = (afterDeclaration.match(usageRegex) || []).length;
    
    // If used only once (the declaration itself), it's unused
    if (usagesAfter === 0) {
      unusedVars.push({
        file: filePath,
        variable: varName,
        line: content.substring(0, declarationIndex).split('\n').length,
      });
    }
  }
  
  return unusedVars;
}

/**
 * Analyze components
 */
function analyzeComponents() {
  const componentsPath = path.join(config.rootDir, config.componentsDir);
  if (!fs.existsSync(componentsPath)) {
    console.log(`⚠️  Components directory not found: ${componentsPath}`);
    return;
  }
  
  const componentFiles = getAllFiles(componentsPath);
  const allFiles = getAllFiles(config.rootDir);
  
  for (const componentFile of componentFiles) {
    const componentName = getComponentName(componentFile);
    let usageCount = 0;
    
    // Search for component usage in all files
    for (const file of allFiles) {
      if (path.normalize(file) === path.normalize(componentFile)) continue; // Skip the component file itself
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for various usage patterns (escape special regex characters)
      const escapedName = componentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const patterns = [
        new RegExp(`<${escapedName}[\\s/>]`, 'g'), // <ComponentName
        new RegExp(`['"]${escapedName}['"]`, 'g'), // 'ComponentName'
        new RegExp(`import.*${escapedName}`, 'g'), // import ComponentName
        new RegExp(`components:\\s*{[^}]*${escapedName}`, 'g'), // components: { ComponentName }
      ];
      
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          usageCount += matches.length;
        }
      }
    }
    
    results.componentUsage.set(componentFile, usageCount);
    
    if (usageCount === 0) {
      results.unusedComponents.push({
        file: path.relative(config.rootDir, componentFile),
        name: componentName,
      });
    }
  }
}

/**
 * Analyze composables
 */
function analyzeComposables() {
  const composablesPath = path.join(config.rootDir, config.composablesDir);
  if (!fs.existsSync(composablesPath)) {
    console.log(`⚠️  Composables directory not found: ${composablesPath}`);
    return;
  }
  
  const composableFiles = getAllFiles(composablesPath);
  const allFiles = getAllFiles(config.rootDir);
  
  for (const composableFile of composableFiles) {
    const composableName = getComposableName(composableFile);
    let usageCount = 0;
    
    // Search for composable usage in all files
    for (const file of allFiles) {
      if (path.normalize(file) === path.normalize(composableFile)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for usage patterns
      const patterns = [
        new RegExp(`${composableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\(`, 'g'), // useComposable(
        new RegExp(`import.*${composableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), // import { useComposable }
      ];
      
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          usageCount += matches.length;
        }
      }
    }
    
    results.composableUsage.set(composableFile, usageCount);
    
    if (usageCount === 0) {
      results.unusedComposables.push({
        file: path.relative(config.rootDir, composableFile),
        name: composableName,
      });
    }
  }
}

/**
 * Analyze unused variables across all files
 */
function analyzeVariables() {
  const allFiles = getAllFiles(config.rootDir);
  
  for (const file of allFiles) {
    const unusedVars = findUnusedVariables(file);
    if (unusedVars.length > 0) {
      results.unusedVariables.push(...unusedVars.map(v => ({
        ...v,
        file: path.relative(config.rootDir, v.file),
      })));
    }
  }
}

/**
 * Print results
 */
function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 UNUSED CODE ANALYSIS RESULTS');
  console.log('='.repeat(60) + '\n');
  
  // Unused Components
  if (results.unusedComponents.length > 0) {
    console.log(`🔴 UNUSED COMPONENTS (${results.unusedComponents.length}):`);
    console.log('-'.repeat(60));
    results.unusedComponents.forEach(comp => {
      console.log(`  • ${comp.name}`);
      console.log(`    File: ${comp.file}`);
    });
    console.log('');
  } else {
    console.log('✅ No unused components found\n');
  }
  
  // Unused Composables
  if (results.unusedComposables.length > 0) {
    console.log(`🔴 UNUSED COMPOSABLES (${results.unusedComposables.length}):`);
    console.log('-'.repeat(60));
    results.unusedComposables.forEach(comp => {
      console.log(`  • ${comp.name}`);
      console.log(`    File: ${comp.file}`);
    });
    console.log('');
  } else {
    console.log('✅ No unused composables found\n');
  }
  
  // Unused Variables
  if (results.unusedVariables.length > 0) {
    console.log(`🔴 UNUSED VARIABLES (${results.unusedVariables.length}):`);
    console.log('-'.repeat(60));
    
    // Group by file
    const byFile = results.unusedVariables.reduce((acc, v) => {
      if (!acc[v.file]) acc[v.file] = [];
      acc[v.file].push(v);
      return acc;
    }, {});
    
    Object.entries(byFile).forEach(([file, vars]) => {
      console.log(`  📄 ${file}`);
      vars.forEach(v => {
        console.log(`     • ${v.variable} (line ${v.line})`);
      });
    });
    console.log('');
  } else {
    console.log('✅ No unused variables found\n');
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('📈 SUMMARY:');
  console.log('-'.repeat(60));
  console.log(`  Unused Components: ${results.unusedComponents.length}`);
  console.log(`  Unused Composables: ${results.unusedComposables.length}`);
  console.log(`  Unused Variables: ${results.unusedVariables.length}`);
  console.log('='.repeat(60) + '\n');
  
  // Save to JSON (convert Maps to objects for serialization)
  const outputFile = path.join(config.rootDir, 'unused-code-report.json');
  const serializableResults = {
    ...results,
    componentUsage: Object.fromEntries(results.componentUsage),
    composableUsage: Object.fromEntries(results.composableUsage),
    fileUsage: Object.fromEntries(results.fileUsage),
  };
  fs.writeFileSync(outputFile, JSON.stringify(serializableResults, null, 2));
  console.log(`💾 Detailed report saved to: ${outputFile}\n`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Analyzing project for unused code...\n');
  console.log(`📁 Project directory: ${config.rootDir}\n`);
  
  try {
    analyzeComponents();
    analyzeComposables();
    analyzeVariables();
    printResults();
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    process.exit(1);
  }
}

// Run the analyzer
main();
