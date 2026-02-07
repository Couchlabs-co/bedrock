/**
 * Application error class with structured error codes.
 */
export class AppError extends Error
{
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: Record<string, string>;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = "INTERNAL_ERROR",
        details?: Record<string, string>,
    )
    {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }

    /**
     * Serialise for JSON API response.
     */
    toJSON(): { error: string; code: string; details?: Record<string, string> }
    {
        return {
            error: this.message,
            code: this.code,
            ...(this.details && { details: this.details }),
        };
    }
}

/** Factory helpers for common errors */
export function notFound(message = "Resource not found"): AppError
{
    return new AppError(message, 404, "NOT_FOUND");
}

export function badRequest(message: string, details?: Record<string, string>): AppError
{
    return new AppError(message, 400, "BAD_REQUEST", details);
}

export function unauthorized(message = "Authentication required"): AppError
{
    return new AppError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Insufficient permissions"): AppError
{
    return new AppError(message, 403, "FORBIDDEN");
}

export function conflict(message: string, details?: Record<string, string>): AppError
{
    return new AppError(message, 409, "CONFLICT", details);
}

export function validationError(details: Record<string, string>): AppError
{
    return new AppError("Validation failed", 422, "VALIDATION_ERROR", details);
}
