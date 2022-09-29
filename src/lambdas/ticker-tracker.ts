
import { formatPrice, formatPercentage } from '../helper'
import { TickerType, Ticker } from '../ticker.interface';
import { sendMessage } from '../sns'
import { getTickers } from '../dynamodb';
import { getPrice } from '../api'

export const handler = async (event: any): Promise<void> => {
  console.log(`Event: ${JSON.stringify(event)}`)

  const tickers = await getTickers()
  console.log(tickers)

  let message = ''

  const cryptoTickers = tickers?.filter(x => x.type === TickerType.Crypto)
  const stocksTickers = tickers?.filter(x => x.type === TickerType.Stocks)

  if(cryptoTickers.length) {
    message += 'Cryptos:\n'
    message += await getMessage(cryptoTickers, TickerType.Crypto)
    message += '\n'
  }
  
  if(stocksTickers.length) {
    message += 'Stocks:\n'
    message += await getMessage(stocksTickers, TickerType.Stocks)
  }

  if(message) {
    await sendMessage(message)
    console.log(`Published message: ${message}`)
  }
};

const getMessage = async (tickers: Ticker[], tickerType: TickerType): Promise<string> => {
  let message = ''

  for (const ticker of tickers) {
    const price = await getPrice(ticker, tickerType)
    message += ticker.name + ': ' + formatPrice(price)

    const { target } = ticker
    if(target) {
      message += ` (${ formatPercentage(price/target*100) }% of target)`
    }

    message += '\n'
  }

  return message
}
