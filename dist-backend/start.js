import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set working directory to backend folder
process.chdir(__dirname);

// Set NODE_PATH to include the backend node_modules
process.env.NODE_PATH = path.join(__dirname, 'node_modules');

// Import and start the server
import('./src/server.js')
  .then(() => {
    console.log('Backend server started successfully');
  })
  .catch((error) => {
    console.error('Failed to start backend server:', error);
    process.exit(1);
  });
