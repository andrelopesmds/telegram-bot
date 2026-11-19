import superagent = require('superagent')
import { getCryptoPrice, getStockPrice } from '../src/api'

// Captured from the public CoinPaprika endpoints with ?quotes=BRL.
const bitcoin = require('./fixtures/coinpaprika/btc-bitcoin.json')
const ethereum = require('./fixtures/coinpaprika/eth-ethereum.json')
const litecoin = require('./fixtures/coinpaprika/ltc-litecoin.json')

jest.mock('superagent', () => ({ get: jest.fn() }))
const getMock = superagent.get as jest.Mock
const timeoutMock = jest.fn()

describe('Price APIs', () => {
  beforeEach(() => {
    getMock.mockReset()
    timeoutMock.mockReset()
    getMock.mockReturnValue({ timeout: timeoutMock })
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test.each([
    ['btc-bitcoin', bitcoin],
    ['eth-ethereum', ethereum],
    ['ltc-litecoin', litecoin]
  ])('should return the numeric BRL price for %s', async (key, body) => {
    timeoutMock.mockResolvedValue({ body })

    const price = await getCryptoPrice(key)

    expect(getMock).toHaveBeenCalledWith(
      `https://api.coinpaprika.com/v1/tickers/${body.id}?quotes=BRL`
    )
    expect(price).toBe(body.quotes.BRL.price)
    expect(typeof price).toBe('number')
  })

  test('should use the BRL quote when another currency is also present', async () => {
    timeoutMock.mockResolvedValue({
      body: { quotes: { BRL: { price: 350000 }, USD: { price: 70000 } } }
    })

    await expect(getCryptoPrice('btc-bitcoin')).resolves.toBe(350000)
  })

  test.each([
    undefined,
    {},
    { quotes: null },
    { quotes: { USD: { price: 70000 } } },
    { quotes: { BRL: null } },
    { quotes: { BRL: { price: '350000' } } },
    { quotes: { BRL: { price: NaN } } },
    { quotes: { BRL: { price: Infinity } } }
  ])('should return undefined for an invalid BRL response: %j', async body => {
    timeoutMock.mockResolvedValue({ body })

    await expect(getCryptoPrice('btc-bitcoin')).resolves.toBeUndefined()
  })

  test('should return undefined when the request fails', async () => {
    timeoutMock.mockRejectedValue(new Error('CoinPaprika request failed'))

    await expect(getCryptoPrice('eth-ethereum')).resolves.toBeUndefined()
  })

  test('should log which provider and ticker failed with HTTP and timeout details', async () => {
    timeoutMock.mockRejectedValue(Object.assign(new Error('Upstream request timed out'), {
      code: 'ETIMEDOUT', status: 429, timeout: 5000
    }))

    await expect(getCryptoPrice('ltc-litecoin')).resolves.toBeUndefined()

    expect(JSON.parse((console.warn as jest.Mock).mock.calls[0][0])).toMatchObject({
      event: 'price_lookup_failed', level: 'WARN', provider: 'coinpaprika',
      ticker: 'ltc-litecoin', errorCode: 'ETIMEDOUT', httpStatus: 429,
      timeoutMs: 5000, durationMs: expect.any(Number)
    })
  })

  test('should return a valid stock closing price', async () => {
    timeoutMock.mockResolvedValue({ body: { close: 45 } })

    await expect(getStockPrice('stock-key')).resolves.toBe(45)
    expect(console.warn).not.toHaveBeenCalled()
  })

  test('should log an invalid stock response without dumping its body', async () => {
    timeoutMock.mockResolvedValue({ body: { error: 'private-provider-response' } })

    await expect(getStockPrice('stock-key')).resolves.toBeUndefined()

    const output = (console.warn as jest.Mock).mock.calls[0][0] as string
    expect(JSON.parse(output)).toMatchObject({
      event: 'price_lookup_failed', provider: 'marketstack', ticker: 'stock-key',
      errorMessage: 'Missing or invalid closing price in MarketStack response'
    })
    expect(output).not.toContain('private-provider-response')
  })
})
