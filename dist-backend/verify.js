import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying backend build...');
console.log('Working directory:', process.cwd());
console.log('Script directory:', __dirname);

const requiredFiles = [
  'src/server.js',
  'src/config.js',
  'package.json',
  'bin/node.exe'
];

let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log('✅', file);
  } else {
    console.log('❌', file, 'NOT FOUND');
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log('\n✅ All required files are present!');
  console.log('🚀 You can now test the backend with: node start.js');
} else {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}
