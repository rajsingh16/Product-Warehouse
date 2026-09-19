import cors from 'cors';
import express from 'express';
import apiRouter from './server/routes/api.js';
import authRouter from './server/routes/auth.js';
import { errorHandler, notFound } from './server/middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename__ = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename__); // Fixed variable reference

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// SPA fallback for frontend client-side routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.originalUrl.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
  next();
});

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3001);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Project Warehouse API listening on port ${port}`));
}

export default app;