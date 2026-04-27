export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "AUTHENTICATION_ERROR", message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, "AUTHORIZATION_ERROR", message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, "NOT_FOUND", `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterMs: number) {
    super(429, "RATE_LIMITED", "Too many requests. Please try again later.", {
      retryAfterMs,
    });
  }
}

export class InsufficientFundsError extends AppError {
  constructor() {
    super(402, "INSUFFICIENT_FUNDS", "Insufficient wallet balance for this operation");
  }
}

export class MpesaError extends AppError {
  constructor(message: string, details?: unknown) {
    super(502, "MPESA_ERROR", message, details);
  }
}

import { asyncLocalStorage, logger } from "./logger";
import * as Sentry from "@sentry/nextjs";

export function withErrorHandler(
  handler: (req: Request, context?: { params: Record<string, string> }) => Promise<Response>
) {
  return async (req: Request, context?: { params: Record<string, string> }) => {
    const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
    
    return asyncLocalStorage.run(correlationId, async () => {
      try {
        return await handler(req, context);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { correlationId }
        });

        if (error instanceof AppError) {
          logger.warn(`API AppError: ${error.message}`, { code: error.code, details: error.details });
          return Response.json(
            {
              success: false,
              error: {
                code: error.code,
                message: error.message,
                details: error.details,
              },
            },
            { status: error.statusCode }
          );
        }

        logger.error("Unhandled API error", { 
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined
        });

        return Response.json(
          {
            success: false,
            error: {
              code: "INTERNAL_ERROR",
              message: "An unexpected error occurred. Please try again.",
            },
          },
          { status: 500 }
        );
      }
    });
  };
}
