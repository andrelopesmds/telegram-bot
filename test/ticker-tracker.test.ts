import { handler } from '../src/lambdas/ticker-tracker'
import { mocked } from 'jest-mock'
import { getTickers } from '../src/dynamodb'
import { getStockPrice, getCryptoPrice } from '../src/api'
import { sendMessage } from '../src/sns'
import { Ticker, TickerType } from '../src/ticker.interface'


jest.mock('../src/dynamodb')
const getTickersMock = mocked(getTickers)

jest.mock('../src/api')
const getStockPriceMock = mocked(getStockPrice)
const getCryptoPriceMock = mocked(getCryptoPrice)

jest.mock('../src/sns')
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

describe('Ticker tracker tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()

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

  test('should call getTickers to fetch tickers keys from DB', async () => {
    await handler({});
  
    expect(getTickersMock).toHaveBeenCalled()
  })

  test('should call getPrice to fetch tickers price from external APIs', async () => {
    await handler({});
  
    expect(getStockPriceMock).toHaveBeenCalledTimes(2)
    expect(getCryptoPriceMock).toHaveBeenCalledTimes(1)
  })

  test('should call sendMessage to publish messages to topic', async () => {
    const expectedResponse = 'Stocks:\nstock1: R$\xa090,00 (90% of target)\n' + 
        'stock2: R$\xa0120,00 (80% of target)\n' +
        '\nCryptos:\ncrypto3: R$\xa01,00 (2% of target)\n'

    await handler({})
  
    expect(sendMessageMock).toHaveBeenCalledWith(expectedResponse)
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
  })

  test('should publish only Stocks if there is no Crypto in DB', async () => {
    getTickersMock.mockResolvedValue(stocksMocked)
    const expectedResponse = 'Stocks:\nstock1: R$\xa090,00 (90% of target)\n' + 
        'stock2: R$\xa0120,00 (80% of target)\n\n' 

    await handler({});
  
    expect(sendMessageMock).toHaveBeenCalledWith(expectedResponse)
  })

  test('should still publish a message when one of the requests fails', async () => {
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

    const expectedResponse = `Stocks:\nstock1: R$\xa0${ currentValue },00 (${ percentage }% of target)\n\n` 

    await handler({})

    expect(sendMessageMock).toBeCalledWith(expectedResponse)
  })
})
