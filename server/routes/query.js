// const express = require('express');
// const router = express.Router();
// const { v4: uuidv4 } = require('uuid');
// const { generateDashboard } = require('../controllers/aiController');
// const { getDB } = require('../db/database');

import express from "express"
import { Router } from "express";
import {v4 as uuidv4} from "uuid";
import {generateDashboard} from '../controllers/aiController.js'
import { getDB } from "../db/database.js";

// POST /api/query - Main endpoint to process NL query

const router = Router()
router.post('/', async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const db = getDB();

  // Get or create session
  let session = null;
  if (sessionId) {
    session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  }
  if (!session) {
    const newId = uuidv4();
    db.prepare('INSERT INTO sessions (id, name) VALUES (?, ?)').run(
      newId,
      message.substring(0, 50) + (message.length > 50 ? '...' : '')
    );
    session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(newId);
  }

  // Fetch conversation history for context
  const history = db.prepare(
    'SELECT role, content, dashboard_data FROM messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 10'
  ).all(session.id);

  const conversationHistory = history.map(m => ({
    role: m.role,
    content: m.content,
    dashboardData: m.dashboard_data ? JSON.parse(m.dashboard_data) : null,
  }));

  try {
    // Save user message
    db.prepare('INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)').run(
      uuidv4(), session.id, 'user', message
    );

    // Generate dashboard
    const result = await generateDashboard(message, conversationHistory);

    // Save assistant response
    db.prepare(
      'INSERT INTO messages (id, session_id, role, content, dashboard_data) VALUES (?, ?, ?, ?, ?)'
    ).run(
      uuidv4(),
      session.id,
      'assistant',
      result.success ? result.summary : result.error,
      result.success ? JSON.stringify(result) : null
    );

    // Update session timestamp
    db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(session.id);

    res.json({ ...result, sessionId: session.id });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/query/history/:sessionId
router.get('/history/:sessionId', (req, res) => {
  const db = getDB();
  const { sessionId } = req.params;

  const messages = db.prepare(
    'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC'
  ).all(sessionId);

  res.json({
    messages: messages.map(m => ({
      ...m,
      dashboardData: m.dashboard_data ? JSON.parse(m.dashboard_data) : null,
    })),
  });
});

export default router;
