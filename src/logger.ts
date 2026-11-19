import { BOT_TOKEN, BOT_CHAT_ID, MARKET_STACK_ACCESS_KEY } from './constants'

type LogFields = Record<string, string | number | boolean | undefined>
type LogLevel = 'info' | 'warn' | 'error'

interface ErrorDetails extends LogFields {
  errorName: string
  errorMessage: string
}

const redact = (text: string): string => {
  let result = text.replace(/https?:\/\/[^\s"'<>]+/gi, '[REDACTED_URL]')

  for (const secret of [BOT_TOKEN, BOT_CHAT_ID, MARKET_STACK_ACCESS_KEY]) {
    if (secret) result = result.split(secret).join('[REDACTED]')
  }

  return result
}

const write = (level: LogLevel, event: string, fields: LogFields = {}): void => {
  const safeFields: LogFields = {}
  for (const [key, value] of Object.entries(fields)) {
    safeFields[key] = typeof value === 'string' ? redact(value).slice(0, 1000) : value
  }

  console[level](JSON.stringify({ level: level.toUpperCase(), event, ...safeFields }))
}

export const logger = {
  info: (event: string, fields?: LogFields): void => write('info', event, fields),
  warn: (event: string, fields?: LogFields): void => write('warn', event, fields),
  error: (event: string, fields?: LogFields): void => write('error', event, fields)
}

export const getErrorDetails = (error: unknown): ErrorDetails => {
  if (!error || typeof error !== 'object') {
    return { errorName: 'UnknownError', errorMessage: 'An unknown error occurred' }
  }

  const details = error as {
    name?: unknown
    message?: unknown
    code?: unknown
    status?: unknown
    timeout?: unknown
    $metadata?: { httpStatusCode?: number; requestId?: string }
  }

  return {
    errorName: typeof details.name === 'string' ? redact(details.name) : 'Error',
    errorMessage: typeof details.message === 'string' ? redact(details.message) : 'Unknown error',
    errorCode: typeof details.code === 'string' ? redact(details.code) : undefined,
    httpStatus: typeof details.status === 'number' ? details.status : details.$metadata?.httpStatusCode,
    timeoutMs: typeof details.timeout === 'number' ? details.timeout : undefined,
    awsRequestId: details.$metadata?.requestId
  }
}

export const sanitizeError = (error: unknown): Error => {
  const details = getErrorDetails(error)
  const safeError = new Error(details.errorMessage)
  safeError.name = details.errorName ?? 'Error'

  if (error instanceof Error && error.stack) {
    safeError.stack = redact(error.stack)
  }

  return safeError
}
