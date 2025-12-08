import os from 'os';
import fs from 'fs';
import path from 'path';

// Determine user data directory based on OS
const userDataDir = path.join(os.homedir(), 'AppData', 'Roaming', '@nuqtaplus');

// Path to the database file
const dbFilePath = path.join(userDataDir, 'database', 'nuqtaplus.db');

const ensureDatabaseDirectoryExists = () => {
  const dbDir = path.dirname(dbFilePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
};

ensureDatabaseDirectoryExists();

export { dbFilePath };
