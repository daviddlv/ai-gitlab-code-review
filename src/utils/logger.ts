import type { FastifyBaseLogger } from 'fastify'

/**
 * Logger utility for structured logging compatible with Google Cloud Logging
 * 
 * GCP automatically captures:
 * - Stack traces from Error objects
 * - Severity levels (info, warn, error)
 * - Timestamps
 * - Request context (when using Fastify request logger)
 */

export interface LogContext {
  [key: string]: any
}

export class Logger {
  constructor(private readonly logger: FastifyBaseLogger) {}

  /**
   * Log info message with structured context
   */
  info(message: string, context?: LogContext): void {
    if (context) {
      this.logger.info(context, message)
    } else {
      this.logger.info(message)
    }
  }

  /**
   * Log warning with structured context
   */
  warn(message: string, context?: LogContext): void {
    if (context) {
      this.logger.warn(context, message)
    } else {
      this.logger.warn(message)
    }
  }

  /**
   * Log error with full stack trace for GCP
   * GCP automatically extracts stack traces from the 'err' field
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const logData = {
      ...context,
      ...(error && { 
        err: error,
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack
      })
    }
    this.logger.error(logData, message)
  }

  /**
   * Log debug information (useful for development and troubleshooting)
   */
  debug(message: string, context?: LogContext): void {
    if (context) {
      this.logger.debug(context, message)
    } else {
      this.logger.debug(message)
    }
  }

  /**
   * Log with payload for debugging (sanitizes sensitive data)
   */
  logPayload(message: string, payload: any, sanitize: boolean = true): void {
    const sanitized = sanitize ? this.sanitizePayload(payload) : payload
    this.debug(message, { 
      payload: sanitized,
      payloadSize: JSON.stringify(payload).length
    })
  }

  /**
   * Sanitize sensitive data from payloads
   */
  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload

    const sanitized = Array.isArray(payload) ? [...payload] : { ...payload }
    const sensitiveKeys = ['token', 'api_key', 'apikey', 'password', 'secret', 'authorization', 'private-token']

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizePayload(sanitized[key])
      }
    }

    return sanitized
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger(this.logger.child(context))
  }
}

/**
 * Create a logger instance from Fastify logger
 */
export function createLogger(fastifyLogger: FastifyBaseLogger): Logger {
  return new Logger(fastifyLogger)
}

/**
 * Measure execution time of async operations
 */
export async function measureTime<T>(
  logger: Logger,
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  logger.debug(`Starting ${operationName}`)
  
  try {
    const result = await operation()
    const duration = Date.now() - startTime
    logger.info(`Completed ${operationName}`, { durationMs: duration })
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`Failed ${operationName}`, error as Error, { durationMs: duration })
    throw error
  }
}
