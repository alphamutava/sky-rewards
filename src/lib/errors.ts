export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(`${entity} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class InsufficientBalanceError extends AppError {
  constructor() {
    super('Insufficient wallet balance', 400, 'INSUFFICIENT_BALANCE')
    this.name = 'InsufficientBalanceError'
  }
}

export class PaymentError extends AppError {
  constructor(message: string) {
    super(message, 502, 'PAYMENT_ERROR')
    this.name = 'PaymentError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    const response: any = {
      success: false,
      error: {
        message: error.message,
        code: error.code,
      }
    }
    
    if (error instanceof ValidationError && error.details) {
      response.error.details = error.details
    }
    
    return new Response(JSON.stringify(response), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: (string | number)[]; message: string }> }
    const firstIssue = zodError.issues[0]
    const field = firstIssue?.path?.join('.') || 'input'
    const message = firstIssue?.message || 'Validation failed'

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: `${field}: ${message}`,
          code: 'VALIDATION_ERROR',
          details: zodError.issues,
        }
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
  
  console.error('Unhandled error:', error)
  
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
