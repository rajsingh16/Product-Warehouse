import { HttpError } from '../utils/http.js';

export function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'Authentication required'));
    if (req.user.user_type === 'Administrator' || req.user.permissions.includes(permission)) return next();
    return next(new HttpError(403, `Permission required: ${permission}`));
  };
}

export function requireAnyPermission(...permissions) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'Authentication required'));
    if (req.user.user_type === 'Administrator' || permissions.some((permission) => req.user.permissions.includes(permission))) return next();
    return next(new HttpError(403, `One of these permissions is required: ${permissions.join(', ')}`));
  };
}

export function requireAdministrator(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Authentication required'));
  if (req.user.user_type === 'Administrator') return next();
  return next(new HttpError(403, 'Administrator access required'));
}
