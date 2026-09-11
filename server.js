import cors from 'cors';
import express from 'express';
import apiRouter from './server/routes/api.js';
import { errorHandler, notFound } from './server/middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3001);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Project Warehouse API listening on port ${port}`));
}

export default app;
