import { HttpError } from '../utils/http.js';

export function notFound(_req, _res, next) { next(new HttpError(404, 'Endpoint not found')); }

export function errorHandler(error, _req, res, _next) {
  const status = error.status ?? (error.code === '23505' ? 409 : error.code === '23503' ? 400 : 500);
  let message = error.message ?? 'Internal server error';
  if (error.code === '23505') message = 'A record with the same unique value already exists';
  if (error.code === '23503') message = 'Referenced record does not exist or cannot be deleted';
  if (error.code === '23514') message = 'Input violates a database constraint';
  const body = { success: false, message };
  if (error.details) body.details = error.details;
  if (process.env.NODE_ENV !== 'production' && status >= 500) body.error = error.stack;
  res.status(status).json(body);
}
