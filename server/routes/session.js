// const express = require('express');
// const router = express.Router();
// const { v4: uuidv4 } = require('uuid');
// const { getDB } = require('../db/database');

import express from "express"
import { Router } from "express";
import {v4 as uuidv4} from "uuid";
import {generateDashboard} from '../controllers/aiController.js'
import { getDB } from "../db/database.js";

const router = Router()
// GET /api/session - list all sessions
router.get('/', (req, res) => {
  const db = getDB();
  const sessions = db.prepare(
    'SELECT * FROM sessions ORDER BY updated_at DESC LIMIT 50'
  ).all();
  res.json({ success: true, sessions });
});

// POST /api/session - create new session
router.post('/', (req, res) => {
  const db = getDB();
  const id = uuidv4();
  db.prepare('INSERT INTO sessions (id, name) VALUES (?, ?)').run(id, 'New Session');
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  res.json({ success: true, session });
});

// DELETE /api/session/:id
router.delete('/:id', (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// PATCH /api/session/:id
router.patch('/:id', (req, res) => {
  const db = getDB();
  const { name } = req.body;
  db.prepare('UPDATE sessions SET name = ? WHERE id = ?').run(name, req.params.id);
  res.json({ success: true });
});

export default router;
