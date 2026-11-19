import { handler } from '../src/lambdas/ticker-tracker'
import { mocked } from 'jest-mock'
import { getTickers } from '../src/dynamodb'
import { getStockPrice, getCryptoPrice, sendMessage } from '../src/api'
import { Ticker, TickerType } from '../src/ticker.interface'


jest.mock('../src/dynamodb')
const getTickersMock = mocked(getTickers)

jest.mock('../src/api')
const getStockPriceMock = mocked(getStockPrice)
const getCryptoPriceMock = mocked(getCryptoPrice)

const sendMessageMock = mocked(sendMessage)

const stocksMocked: Ticker[] = [
  {
    key: 'key1',
    name: 'stock1',
    target: 100,
    type: TickerType.Stocks
  },
  {
    key: 'key2',
    name: 'stock2',
    target: 150,
    type: TickerType.Stocks
  }
]
const allTickersMocked: Ticker[] = [
  ...stocksMocked,
  {
    key: 'key3',
    name: 'crypto3',
    target: 50,
    type: TickerType.Crypto
  }
]

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(resolvePromise => { resolve = resolvePromise })
  return { promise, resolve }
}

const loggedEvents = (level: 'info' | 'error') =>
  (console[level] as jest.Mock).mock.calls.map(([line]) => JSON.parse(line))

describe('Ticker tracker tests', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})

    getTickersMock.mockResolvedValue(allTickersMocked)

    getCryptoPriceMock.mockImplementation(async (key: string): Promise<number | undefined> => {
      if(key === 'key3') return 1

      return undefined
    })

    getStockPriceMock.mockImplementation(async (key: string): Promise<number | undefined> => {
      if(key === 'key1') return 90

      if(key === 'key2') return 120

      return undefined
    })

    sendMessageMock.mockResolvedValue()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should call getTickers to fetch tickers keys from DB', async () => {
    await handler({});
  
    expect(getTickersMock).toHaveBeenCalled()
  })

  test('should call getPrice to fetch tickers price from external APIs', async () => {
    await handler({});
  
    expect(getStockPriceMock).toHaveBeenCalledTimes(2)
    expect(getCryptoPriceMock).toHaveBeenCalledTimes(1)
  })

  test('should send the combined ticker message directly to Telegram once', async () => {
    const expectedResponse = 'Stocks:\nstock1: R$\xa090,00 (90% of target)\n' + 
        'stock2: R$\xa0120,00 (80% of target)\n' +
        '\nCryptos:\ncrypto3: R$\xa01,00 (2% of target)\n'

    await handler({})
  
    expect(sendMessageMock).toHaveBeenCalledTimes(1)
    expect(sendMessageMock).toHaveBeenCalledWith(expectedResponse)
    expect(loggedEvents('info')).toEqual(expect.arrayContaining([
      expect.objectContaining({ event: 'tickers_loaded', totalCount: 3, stockCount: 2, cryptoCount: 1 }),
      expect.objectContaining({ event: 'price_group_completed', group: 'Stocks', requestedCount: 2, availableCount: 2, failedCount: 0 }),
      expect.objectContaining({ event: 'price_group_completed', group: 'Crypto', requestedCount: 1, availableCount: 1, failedCount: 0 }),
      expect.objectContaining({ event: 'report_sent', messageLength: expectedResponse.length, durationMs: expect.any(Number) })
    ]))
    expect(JSON.stringify(loggedEvents('info'))).not.toContain('stock1')
  })

  test('should report a failure when Telegram rejects the send', async () => {
    const error = new Error('Telegram request failed')
    sendMessageMock.mockRejectedValue(error)

    await expect(handler({})).rejects.toThrow(error)

    expect(sendMessageMock).toHaveBeenCalledTimes(1)
    expect(loggedEvents('error')).toEqual([
      expect.objectContaining({ event: 'tracker_failed', stage: 'send_message', errorMessage: error.message })
    ])
    expect(loggedEvents('info').some(event => event.event === 'report_sent')).toBe(false)
  })

  test('should log a failed database read and preserve the invocation failure', async () => {
    getTickersMock.mockRejectedValue(new Error('DynamoDB unavailable'))

    await expect(handler({})).rejects.toThrow('DynamoDB unavailable')

    expect(getStockPriceMock).not.toHaveBeenCalled()
    expect(getCryptoPriceMock).not.toHaveBeenCalled()
    expect(sendMessageMock).not.toHaveBeenCalled()
    expect(loggedEvents('error')).toEqual([
      expect.objectContaining({ event: 'tracker_failed', stage: 'load_tickers', errorMessage: 'DynamoDB unavailable' })
    ])
  })

  test('should not try to call getPrice if there is no data in DB', async () => {
    getTickersMock.mockResolvedValue([])

    await handler({});
  
    expect(getStockPriceMock).not.toHaveBeenCalled()
    expect(getCryptoPriceMock).not.toHaveBeenCalled()
  })

  test('should not try to call sendMessage if there is no data in DB', async () => {
    getTickersMock.mockResolvedValue([])

    await handler({});
  
    expect(sendMessageMock).not.toHaveBeenCalled()
    expect(loggedEvents('info')).toContainEqual(
      expect.objectContaining({ event: 'report_skipped', reason: 'no_tickers' })
    )
  })

  test('should send only Stocks if there is no Crypto in DB', async () => {
    getTickersMock.mockResolvedValue(stocksMocked)
    const expectedResponse = 'Stocks:\nstock1: R$\xa090,00 (90% of target)\n' + 
        'stock2: R$\xa0120,00 (80% of target)\n'

    await handler({});
  
    expect(sendMessageMock).toHaveBeenCalledWith(expectedResponse)
  })

  test('should omit the Stocks heading when all stock lookups fail', async () => {
    getStockPriceMock.mockResolvedValue(undefined)

    await handler({})

    expect(sendMessageMock).toHaveBeenCalledWith(
      'Cryptos:\ncrypto3: R$\xa01,00 (2% of target)\n'
    )
  })

  test('should omit the Cryptos heading when all crypto lookups fail', async () => {
    getCryptoPriceMock.mockResolvedValue(undefined)

    await handler({})

    expect(sendMessageMock).toHaveBeenCalledWith(
      'Stocks:\nstock1: R$\xa090,00 (90% of target)\n' +
      'stock2: R$\xa0120,00 (80% of target)\n'
    )
  })

  test('should not send a message when every price lookup fails', async () => {
    getStockPriceMock.mockResolvedValue(undefined)
    getCryptoPriceMock.mockResolvedValue(undefined)

    await handler({})

    expect(sendMessageMock).not.toHaveBeenCalled()
    expect(loggedEvents('info')).toEqual(expect.arrayContaining([
      expect.objectContaining({ event: 'price_group_completed', group: 'Stocks', availableCount: 0, failedCount: 2 }),
      expect.objectContaining({ event: 'price_group_completed', group: 'Crypto', availableCount: 0, failedCount: 1 }),
      expect.objectContaining({ event: 'report_skipped', reason: 'no_valid_prices' })
    ]))
  })

  test('should continue the group after a failed lookup', async () => {
    getStockPriceMock.mockResolvedValueOnce(undefined)

    await handler({})

    expect(sendMessageMock).toHaveBeenCalledWith(
      'Stocks:\nstock2: R$\xa0120,00 (80% of target)\n' +
      '\nCryptos:\ncrypto3: R$\xa01,00 (2% of target)\n'
    )
  })

  test('should include a valid zero price', async () => {
    getTickersMock.mockResolvedValue([allTickersMocked[2]])
    getCryptoPriceMock.mockResolvedValue(0)

    await handler({})

    expect(sendMessageMock).toHaveBeenCalledWith(
      'Cryptos:\ncrypto3: R$\xa00,00 (0% of target)\n'
    )
    expect(loggedEvents('info')).toContainEqual(
      expect.objectContaining({ event: 'price_group_completed', availableCount: 1, failedCount: 0 })
    )
  })

  test('should run groups concurrently with sequential requests and stable output order', async () => {
    const firstStock = deferred<number | undefined>()
    const secondStock = deferred<number | undefined>()
    const firstCrypto = deferred<number | undefined>()
    const secondCrypto = deferred<number | undefined>()
    const firstStockStarted = deferred<void>()
    const secondStockStarted = deferred<void>()
    const firstCryptoStarted = deferred<void>()
    const secondCryptoStarted = deferred<void>()

    getTickersMock.mockResolvedValue([
      ...allTickersMocked,
      { key: 'key4', name: 'crypto4', type: TickerType.Crypto }
    ])
    getStockPriceMock
      .mockImplementationOnce(() => {
        firstStockStarted.resolve(undefined)
        return firstStock.promise
      })
      .mockImplementationOnce(() => {
        secondStockStarted.resolve(undefined)
        return secondStock.promise
      })
    getCryptoPriceMock
      .mockImplementationOnce(() => {
        firstCryptoStarted.resolve(undefined)
        return firstCrypto.promise
      })
      .mockImplementationOnce(() => {
        secondCryptoStarted.resolve(undefined)
        return secondCrypto.promise
      })

    const running = handler({})

    try {
      await Promise.all([firstStockStarted.promise, firstCryptoStarted.promise])
      expect(getStockPriceMock.mock.calls).toEqual([['key1']])
      expect(getCryptoPriceMock.mock.calls).toEqual([['key3']])

      firstCrypto.resolve(1)
      await secondCryptoStarted.promise
      expect(getCryptoPriceMock.mock.calls).toEqual([['key3'], ['key4']])
      expect(getStockPriceMock.mock.calls).toEqual([['key1']])

      secondCrypto.resolve(2)
      await secondCrypto.promise
      expect(sendMessageMock).not.toHaveBeenCalled()

      firstStock.resolve(90)
      await secondStockStarted.promise
      expect(getStockPriceMock.mock.calls).toEqual([['key1'], ['key2']])
      expect(sendMessageMock).not.toHaveBeenCalled()

      secondStock.resolve(120)
      await running

      expect(sendMessageMock).toHaveBeenCalledTimes(1)
      expect(sendMessageMock).toHaveBeenCalledWith(
        'Stocks:\nstock1: R$\xa090,00 (90% of target)\n' +
        'stock2: R$\xa0120,00 (80% of target)\n' +
        '\nCryptos:\ncrypto3: R$\xa01,00 (2% of target)\ncrypto4: R$\xa02,00\n'
      )
    } finally {
      firstStock.resolve(90)
      secondStock.resolve(120)
      firstCrypto.resolve(1)
      secondCrypto.resolve(2)
      await running
    }
  })

  test('should still send a message when one of the price requests fails', async () => {
    const invalidTicker: Ticker = {
      key: 'invalid-key',
      name: 'name',
      type: TickerType.Stocks
    }
    getTickersMock.mockResolvedValue([
      ...allTickersMocked,
      invalidTicker
    ])

    const expectedResponse = 'Stocks:\nstock1: R$\xa090,00 (90% of target)\n' + 
      'stock2: R$\xa0120,00 (80% of target)\n' +
      '\nCryptos:\ncrypto3: R$\xa01,00 (2% of target)\n'

    await handler({})

    expect(sendMessageMock).toBeCalledWith(expectedResponse)
  })

  test.each([
    { target: 90, currentValue: 94, percentage: '104' },
    { target: 45, currentValue: 32, percentage: '71,1' },
    { target: 30, currentValue: 10, percentage: '33,3' },
  ])('should show up to 3 significant digits for percentages: $currentValue is $percentage% of $target', async ({ target, currentValue, percentage }) => {
    const mockedTickers = [{
      ...stocksMocked[0],
      target
    }]

    getTickersMock.mockResolvedValue(mockedTickers)
    getStockPriceMock.mockResolvedValue(currentValue)

    const expectedResponse = `Stocks:\nstock1: R$\xa0${ currentValue },00 (${ percentage }% of target)\n`

    await handler({})

    expect(sendMessageMock).toBeCalledWith(expectedResponse)
  })
})
