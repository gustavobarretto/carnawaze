export interface ApiErrorBody {
  status: string;
  code: string;
  message: string;
  details?: unknown[];
}

export class AppError extends Error {
  constructor(
    public readonly status: string,
    public readonly code: string,
    message: string,
    public readonly details?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON(): ApiErrorBody {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export function badRequest(code: string, message: string, details?: unknown[]) {
  return new AppError('BAD_REQUEST', code, message, details);
}

export function unauthorized(message = 'Unauthorized') {
  return new AppError('UNAUTHORIZED', 'UNAUTHORIZED', message);
}

export function forbidden(message = 'Forbidden') {
  return new AppError('FORBIDDEN', 'FORBIDDEN', message);
}

export function notFound(message = 'Not found') {
  return new AppError('NOT_FOUND', 'NOT_FOUND', message);
}
