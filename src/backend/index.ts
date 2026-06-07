// Backend entry point
// src/backend/index.ts

import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import { authenticateToken } from './middleware/auth.middleware';
import carsRoutes from './routes/cars.routes';
import customersRoutes from './routes/customers.routes';
import contractsRoutes from './routes/contracts.routes';
import invoicesRoutes from './routes/invoices.routes';
import paymentsRoutes from './routes/payments.routes';
import reservationsRoutes from './routes/reservations.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import inspectionsRoutes from './routes/inspections.routes';
import insurancesRoutes from './routes/insurances.routes';
import leasingRoutes from './routes/leasing.routes';
import vignettesRoutes from './routes/vignettes.routes';
import settingsRoutes from './routes/settings.routes';
import demoRoutes from './routes/demo.routes';

// Supabase REST API Client
// Uses service role key when available (bypasses RLS for backend writes)
function getEnvCI(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const lower = name.toLowerCase();
  const found = Object.keys(process.env).find(k => k.toLowerCase() === lower);
  return found ? process.env[found] : undefined;
}

const supabaseUrl = getEnvCI('SUPABASE_URL');
const supabaseAnonKey = getEnvCI('SUPABASE_ANON_KEY');
// Accept SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY (both common names)
const supabaseServiceKey =
  getEnvCI('SUPABASE_SERVICE_KEY') ||
  getEnvCI('SUPABASE_SERVICE_ROLE_KEY') ||
  supabaseAnonKey;

console.log(`Supabase: url=${supabaseUrl ? '✓' : '✗'} anon=${supabaseAnonKey ? '✓' : '✗'} service=${supabaseServiceKey !== supabaseAnonKey ? '✓' : '✗ (fallback to anon)'}`);

const supabaseClient = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json',
  },
});

// Make client available globally
declare global {
  var db: typeof supabaseClient;
}
global.db = supabaseClient;

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/v1/health', async (req: Request, res: Response) => {
  try {
    await supabaseClient.get('/cars?limit=1');
    res.json({
      success: true,
      message: 'API is healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: String(err),
    });
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'LocaCar API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/v1/health',
  });
});

// Authentication routes
app.use('/api/v1/auth', authRoutes);

// Protect API routes with JWT authentication
app.use('/api/v1', authenticateToken);

// Protected resource routes
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/cars', carsRoutes);
app.use('/api/v1/customers', customersRoutes);
app.use('/api/v1/contracts', contractsRoutes);
app.use('/api/v1/invoices', invoicesRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/reservations', reservationsRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/inspections', inspectionsRoutes);
app.use('/api/v1/insurances', insurancesRoutes);
app.use('/api/v1/leasing', leasingRoutes);
app.use('/api/v1/vignettes', vignettesRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/demo', demoRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
});

async function start() {
  try {
    // Test connection
    await supabaseClient.get('/cars?limit=1');
    console.log('✓ Supabase connected');

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API health check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

start();
