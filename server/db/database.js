// import Database from 'better-sqlite3';
// import path from 'path';
// import fs from 'fs';



// const DB_PATH = path.join(__dirname, '..', 'data', 'bi_dashboard.db');
// const DATA_DIR = path.join(__dirname, '..', 'data');

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'bi_dashboard.db');
const DATA_DIR = path.join(__dirname, '..', 'data');


let db = null;

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

async function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Sessions table for conversation history
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'New Session',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      dashboard_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS uploaded_datasets (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      filename TEXT NOT NULL,
      table_name TEXT NOT NULL UNIQUE,
      columns TEXT NOT NULL,
      row_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database initialized at', DB_PATH);
  return db;
}

/**
 * Get the schema of a specific table or all user tables
 */
function getTableSchema(tableName = null) {
  const db = getDB();
  
  if (tableName) {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const sampleData = db.prepare(`SELECT * FROM ${tableName} LIMIT 5`).all();
    const rowCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    return { tableName, columns: tableInfo, sampleData, rowCount: rowCount.count };
  }

  // Get all user-created tables (not system tables)
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name NOT IN ('sessions', 'messages', 'uploaded_datasets', 'sqlite_sequence')
    ORDER BY name
  `).all();

  return tables.map(({ name }) => {
    const columns = db.prepare(`PRAGMA table_info(${name})`).all();
    const sample = db.prepare(`SELECT * FROM ${name} LIMIT 3`).all();
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get();
    return { tableName: name, columns, sampleData: sample, rowCount: count.count };
  });
}

/**
 * Execute a read-only SQL query safely
 */
function executeQuery(sql) {
  const db = getDB();
  const trimmed = sql.trim().toUpperCase();
  
  // Only allow SELECT statements
  if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
    throw new Error('Only SELECT queries are allowed.');
  }

  // Block dangerous keywords
  const dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'ATTACH', 'DETACH'];
  for (const keyword of dangerous) {
    if (trimmed.includes(keyword)) {
      throw new Error(`Query contains forbidden keyword: ${keyword}`);
    }
  }

  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all();
    return { success: true, rows, rowCount: rows.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export { initDatabase, getDB, getTableSchema, executeQuery };
