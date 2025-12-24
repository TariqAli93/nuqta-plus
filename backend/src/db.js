import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname as pathDirname } from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import * as schema from './models/index.js';

// Ensure data directory exists
const dbPath = config.database.path;
const dbDir = pathDirname(dbPath);
mkdirSync(dbDir, { recursive: true });

// Initialize SQLite database with sql.js
let saveDatabaseFn;
let closeDatabaseFn;

async function initDB() {
  const SQL = await initSqlJs();

  let buffer;
  if (existsSync(dbPath)) {
    buffer = readFileSync(dbPath);
  }

  const sqlite = new SQL.Database(buffer);

  // Enable foreign keys
  sqlite.run('PRAGMA foreign_keys = ON');

  // Save database function
  const saveDatabase = () => {
    const data = sqlite.export();
    writeFileSync(dbPath, data);
  };

  // Close database function
  const closeDatabase = () => {
    sqlite.close();
  };

  // Store the close function for export
  closeDatabaseFn = closeDatabase;

  // Store the save function for export
  saveDatabaseFn = saveDatabase;

  // Auto-save on changes
  process.on('exit', saveDatabase);
  process.on('SIGINT', () => {
    saveDatabase();
    process.exit(0);
  });

  // Create Drizzle instance
  const db = drizzle(sqlite, { schema });

  // Check if migrations table exists
  const checkMigrationsTable = () => {
    try {
      const result = sqlite.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='__drizzle_migrations'
      `);
      return result.length > 0 && result[0].values.length > 0;
    } catch {
      return false;
    }
  };

  // Run pending migrations only if migrations table doesn't exist or is empty
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = pathDirname(__filename);
  const migrationsFolder = join(__dirname, '../drizzle');

  try {
    const hasMigrationsTable = checkMigrationsTable();

    if (!hasMigrationsTable) {
      // First time - run migrations
      await migrate(db, { migrationsFolder });
      console.log('✅ Database migrations applied successfully');
    } else {
      // Check if all tables exist
      const result = sqlite.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users'
      `);
      const tablesExist = result.length > 0 && result[0].values.length > 0;

      if (!tablesExist) {
        // Tables missing - run migrations
        await migrate(db, { migrationsFolder });
        console.log('✅ Database migrations applied successfully');
      } else {
        console.log('ℹ️  Database already migrated - skipping');
      }
    }
  } catch (error) {
    // If migration fails because tables exist, it's okay
    if (error.message?.includes('already exists')) {
      console.log('⚠️  Migrations skipped - tables already exist');
    } else {
      throw error;
    }
  }

  // Run roleId -> role migration if needed (on the same sqlite instance)
  try {
    const { default: migrateRoleIdToRole } = await import('./migrations/migrateRoleIdToRole.js');
    await migrateRoleIdToRole(sqlite); // Pass the sqlite instance
  } catch (error) {
    // Migration is optional - log but don't fail
    console.log('⚠️  Role migration check skipped:', error.message);
  }

  // Persist DB to disk after migrations
  saveDatabase();
  return db;
}

// Export async initialized db promise
export const dbPromise = initDB();

// Cache the resolved db instance
let dbInstance = null;

// Helper to get the db instance (resolves promise once and caches)
export const getDb = async () => {
  if (dbInstance) return dbInstance;
  dbInstance = await dbPromise;
  return dbInstance;
};

export const saveDatabase = () => {
  if (saveDatabaseFn) {
    saveDatabaseFn();
  }
};

export default dbPromise;
