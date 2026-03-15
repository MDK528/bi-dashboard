// const express = require('express');
// const router = express.Router();
// const { getTableSchema } = require('../db/database');

import express from "express"
import { Router } from "express";
import { getTableSchema } from "../db/database.js";

const router = Router()
// GET /api/schema - return all table schemas
router.get('/', (req, res) => {
  try {
    const schemas = getTableSchema();
    res.json({ success: true, schemas });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/schema/:tableName
router.get('/:tableName', (req, res) => {
  try {
    const schema = getTableSchema(req.params.tableName);
    res.json({ success: true, schema });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
