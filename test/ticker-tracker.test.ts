import { handler } from '../src/lambdas/ticker-tracker'
import { mocked } from 'jest-mock'
import { getTickers } from '../src/dynamodb'
import { getPrice } from '../src/api'
import { sendMessage } from '../src/sns'
import { Ticker, TickerType } from '../src/ticker.interface'


jest.mock('../src/dynamodb')
const getTickersMock = mocked(getTickers)

jest.mock('../src/api')
const getPriceMock = mocked(getPrice)

jest.mock('../src/sns')
const sendMessageMock = mocked(sendMessage)

const getMockedTicker = (n: number, type: TickerType): Ticker => {
  return {
    key: `key-${ n }`,
    name: `name-${ n }`,
    target: 100 + n,
    type
  }
}

describe('Ticker tracker tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    getTickersMock.mockResolvedValue([
      getMockedTicker(1, TickerType.Stocks),
      getMockedTicker(2, TickerType.Stocks),
      getMockedTicker(3, TickerType.Crypto)
    ])

    getPriceMock.mockResolvedValueOnce(10).mockResolvedValueOnce(15).mockResolvedValueOnce(20)

    sendMessageMock.mockResolvedValue()
  })

  test('should call getTickers to fetch tickers keys from DB', async () => {
    await handler({});
  
    expect(getTickersMock).toHaveBeenCalled()
  })

  test('should call getPrice to fetch tickers price from external APIs', async () => {
    await handler({});
  
    expect(getPriceMock).toHaveBeenCalledTimes(3)
  })

  test('should call sendMessage to publish messages to topic', async () => {
    const expectedResponse = 'Cryptos:\nname-3: R$\xa010,00 (9,7% of target)\n' + 
        '\nStocks:\nname-1: R$\xa015,00 (15% of target)\nname-2: R$\xa020,00 (20% of target)\n'

    await handler({})
  
    expect(sendMessageMock).toHaveBeenCalledWith(expectedResponse)
  })

  test('should not try to call getPrice if there is no data in DB', async () => {
    getTickersMock.mockResolvedValue([])

    await handler({});
  
    expect(getPriceMock).not.toHaveBeenCalled()
  })

  test('should not try to call sendMessage if there is no data in DB', async () => {
    getTickersMock.mockResolvedValue([])

    await handler({});
  
    expect(sendMessageMock).not.toHaveBeenCalled()
  })

  test('should publish only Stocks if there is no Crypto in DB', async () => {
    getTickersMock.mockResolvedValue([getMockedTicker(1, TickerType.Stocks)])
    const expectedResponse = 'Stocks:\nname-1: R$\xa010,00 (9,9% of target)\n'

    await handler({});
  
    expect(sendMessageMock).toHaveBeenCalledWith(expectedResponse)
  })
})
