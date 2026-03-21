import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export function errorMiddleware(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal Server Error';

    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

export function createError(message: string, statusCode: number): AppError {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
    next(createError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}
