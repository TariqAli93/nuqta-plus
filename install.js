import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Check if a command is available in the system
 */
const isCommandAvailable = (command) => {
  try {
    if (process.platform === 'win32') {
      execSync(`where ${command}`, { stdio: 'ignore' });
    } else {
      execSync(`which ${command}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Get the package manager to use (pnpm preferred, fallback to npm)
 */
const getPackageManager = () => {
  if (isCommandAvailable('pnpm')) {
    return {
      name: 'pnpm',
      command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      install: 'install',
    };
  }
  
  if (isCommandAvailable('npm')) {
    console.warn('⚠️  pnpm not found, falling back to npm');
    return {
      name: 'npm',
      command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      install: 'install',
    };
  }
  
  throw new Error('❌ Neither pnpm nor npm is available. Please install pnpm (recommended) or npm.');
};

/**
 * Install dependencies in a directory
 */
const installInDirectory = (dir, packageManager, dirName) => {
  const dirPath = join(__dirname, dir);
  
  if (!existsSync(dirPath)) {
    console.warn(`⚠️  Directory ${dir} does not exist, skipping...`);
    return false;
  }
  
  const packageJsonPath = join(dirPath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    console.warn(`⚠️  package.json not found in ${dir}, skipping...`);
    return false;
  }
  
  try {
    console.log(`\n📦 Installing dependencies for ${dirName}...`);
    execSync(`${packageManager.command} ${packageManager.install}`, {
      cwd: dirPath,
      stdio: 'inherit',
    });
    console.log(`✅ Successfully installed dependencies for ${dirName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to install dependencies for ${dirName}:`, error.message);
    throw error;
  }
};

/**
 * Main installation function
 */
const installDependencies = () => {
  console.log('🚀 Starting dependency installation...\n');
  
  const packageManager = getPackageManager();
  console.log(`📌 Using package manager: ${packageManager.name}\n`);
  
  let successCount = 0;
  const directories = [
    { path: '.', name: 'root' },
    { path: 'backend', name: 'backend' },
    { path: 'frontend', name: 'frontend' },
  ];
  
  for (const dir of directories) {
    try {
      if (installInDirectory(dir.path, packageManager, dir.name)) {
        successCount++;
      }
    } catch (error) {
      console.error(`\n❌ Installation failed for ${dir.name}`);
      process.exit(1);
    }
  }
  
  console.log(`\n✨ Installation complete! (${successCount}/${directories.length} directories)`);
  console.log('\n💡 Next steps:');
  console.log('   - Run "pnpm dev" to start development servers');
  console.log('   - Run "pnpm build" to build for production');
};

// Run installation
try {
  installDependencies();
} catch (error) {
  console.error('\n❌ Installation script failed:', error.message);
  process.exit(1);
}