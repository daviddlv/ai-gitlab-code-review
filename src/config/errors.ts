export class BaseError<T extends string> extends Error {
  override name: T
  override message: string
  override cause: any
  statusCode: number
  error?: Error

  constructor ({
    name,
    message,
    cause,
    error,
    statusCode = 500
  }: {
    name: T
    message: string
    cause?: any
    error?: Error
    statusCode?: number
  }) {
    super()
    this.name = name
    this.message = message
    this.cause = cause
    this.error = error
    this.statusCode = statusCode
  }
}
