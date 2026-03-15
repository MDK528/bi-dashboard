// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
import express from "express"
import { Router } from "express";
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { getDB } from '../db/database.js';
import multer from "multer";
import { fileURLToPath } from "url";

const router = Router()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) cb(null, true);
    else cb(new Error('Only CSV files are allowed'));
  },
});

function sanitizeTableName(filename) {
  return filename
    .replace(/\.csv$/i, '')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&')
    .substring(0, 50)
    .toLowerCase();
}

function inferSQLiteType(values) {
  const nonNull = values.filter(v => v !== '' && v !== null && v !== undefined);
  if (nonNull.length === 0) return 'TEXT';
  if (nonNull.every(v => !isNaN(v) && Number.isInteger(Number(v)))) return 'INTEGER';
  if (nonNull.every(v => !isNaN(v))) return 'REAL';
  if (nonNull.every(v => /^\d{4}-\d{2}-\d{2}/.test(v))) return 'DATE';
  return 'TEXT';
}

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const db = getDB();
  const filePath = req.file.path;
  const sessionId = req.body.sessionId || null;

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    const columns = Object.keys(records[0]);
    const baseName = sanitizeTableName(req.file.originalname);
    let tableName = baseName;
    
    // Ensure unique table name
    let suffix = 1;
    while (db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableName)) {
      tableName = `${baseName}_${suffix++}`;
    }

    // Infer column types
    const columnTypes = {};
    for (const col of columns) {
      const values = records.map(r => r[col]);
      columnTypes[col] = inferSQLiteType(values);
    }

    // Create table
    const colDefs = columns.map(c => `"${c}" ${columnTypes[c]}`).join(', ');
    db.exec(`CREATE TABLE IF NOT EXISTS "${tableName}" (id INTEGER PRIMARY KEY AUTOINCREMENT, ${colDefs})`);

    // Insert rows in batches
    const placeholders = columns.map(() => '?').join(', ');
    const insertStmt = db.prepare(`INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`);
    
    const insertAll = db.transaction((rows) => {
      for (const row of rows) {
        insertStmt.run(columns.map(c => row[c] || null));
      }
    });
    insertAll(records);

    // Register in uploaded_datasets
    db.prepare(`
      INSERT INTO uploaded_datasets (id, session_id, filename, table_name, columns, row_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      sessionId,
      req.file.originalname,
      tableName,
      JSON.stringify(columns.map(c => ({ name: c, type: columnTypes[c] }))),
      records.length
    );

    // Clean up file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      tableName,
      columns: columns.map(c => ({ name: c, type: columnTypes[c] })),
      rowCount: records.length,
      message: `Successfully imported "${req.file.originalname}" as table "${tableName}" with ${records.length} rows.`,
    });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/upload/datasets - list uploaded datasets
router.get('/datasets', (req, res) => {
  const db = getDB();
  const datasets = db.prepare('SELECT * FROM uploaded_datasets ORDER BY created_at DESC').all();
  res.json({ success: true, datasets });
});

// DELETE /api/upload/:tableName
router.delete('/:tableName', (req, res) => {
  const db = getDB();
  const { tableName } = req.params;
  try {
    db.exec(`DROP TABLE IF EXISTS "${tableName}"`);
    db.prepare('DELETE FROM uploaded_datasets WHERE table_name = ?').run(tableName);
    res.json({ success: true, message: `Table "${tableName}" deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
