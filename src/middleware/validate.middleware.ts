import type { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../errors/api-error.js';

export function validateCreateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const body = req.body as { name?: unknown } | undefined;

  if (
    !body ||
    !('name' in body) ||
    body.name === undefined ||
    body.name === null
  ) {
    return next(new ValidationError(400, 'Missing or empty name'));
  }

  if (typeof body.name !== 'string') {
    return next(new ValidationError(422, 'Invalid type'));
  }

  const trimmedName = body.name.trim();
  if (!trimmedName) {
    return next(new ValidationError(400, 'Missing or empty name'));
  }

  res.locals.validName = trimmedName;
  next();
}
