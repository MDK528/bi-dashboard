// import {configDotenv} from 'dotenv';
// configDotenv()
import 'dotenv/config'

import express from'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';

import queryRoutes from './routes/query.js';
import schemaRoutes from './routes/schema.js';
import uploadRoutes  from './routes/upload.js';
import sessionRoutes  from './routes/session.js';
import { initDatabase }  from './db/database.js';
import { fileURLToPath } from 'url';



const app = express();
const PORT = process.env.PORT || 5000;



// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Uploads folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes
app.use('/api/query', queryRoutes);
app.use('/api/schema', schemaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/session', sessionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Initialize DB then start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
