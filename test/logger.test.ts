import { logger, getErrorDetails, sanitizeError } from '../src/logger'

jest.mock('../src/constants', () => ({
  BOT_TOKEN: 'test-bot-token',
  BOT_CHAT_ID: 'test-chat-id',
  MARKET_STACK_ACCESS_KEY: 'test-market-key'
}))

describe('Structured logging', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should emit a JSON record with severity and searchable fields', () => {
    logger.info('tickers_loaded', { totalCount: 3, durationMs: 12 })

    expect(JSON.parse((console.info as jest.Mock).mock.calls[0][0])).toEqual({
      level: 'INFO', event: 'tickers_loaded', totalCount: 3, durationMs: 12
    })
  })

  test('should retain error diagnostics without logging credentials or request objects', () => {
    const error = Object.assign(new Error(
      'Upstream failure https://api.telegram.org/bottest-bot-token/sendMessage ' +
      'test-bot-token test-chat-id test-market-key'
    ), {
      code: 'ETIMEDOUT', status: 429, timeout: 5000,
      request: { url: 'https://example.test/?access_key=test-market-key' },
      response: { body: 'private-response' },
      $metadata: { httpStatusCode: 429, requestId: 'aws-request-id' }
    })

    logger.warn('price_lookup_failed', getErrorDetails(error))

    const output = (console.warn as jest.Mock).mock.calls[0][0] as string
    expect(JSON.parse(output)).toMatchObject({
      level: 'WARN', event: 'price_lookup_failed', errorName: 'Error',
      errorCode: 'ETIMEDOUT', httpStatus: 429, timeoutMs: 5000,
      awsRequestId: 'aws-request-id'
    })
    expect(output).toContain('Upstream failure')
    for (const sensitive of [
      'test-bot-token', 'test-chat-id', 'test-market-key',
      'https://', 'private-response'
    ]) {
      expect(output).not.toContain(sensitive)
    }
    expect(JSON.parse(output)).not.toHaveProperty('request')
    expect(JSON.parse(output)).not.toHaveProperty('response')
  })

  test('should sanitize errors rethrown to the Lambda runtime as well as their stacks', () => {
    const error = Object.assign(new Error(
      'Failed https://example.test/?access_key=test-market-key test-bot-token'
    ), { request: { token: 'test-bot-token' } })

    const safeError = sanitizeError(error)
    const runtimeOutput = `${safeError.message}\n${safeError.stack}`

    expect(safeError).toBeInstanceOf(Error)
    expect(safeError).not.toBe(error)
    expect(runtimeOutput).toContain('Failed')
    expect(runtimeOutput).not.toContain('test-market-key')
    expect(runtimeOutput).not.toContain('test-bot-token')
    expect(runtimeOutput).not.toContain('https://')
    expect(safeError).not.toHaveProperty('request')
    expect(safeError).not.toHaveProperty('cause')
  })

  test('should include AWS error status and request ID', () => {
    const details = getErrorDetails({
      name: 'ProvisionedThroughputExceededException',
      message: 'Read capacity exceeded',
      $metadata: { httpStatusCode: 400, requestId: 'aws-request-id' }
    })

    expect(details).toMatchObject({
      errorName: 'ProvisionedThroughputExceededException',
      httpStatus: 400, awsRequestId: 'aws-request-id'
    })
  })
})
