
import { formatPrice, formatPercentage } from '../helper'
import { TickerType, Ticker } from '../ticker.interface';
import { sendMessage } from '../sns'
import { getTickers } from '../dynamodb';
import { getStockPrice, getCryptoPrice } from '../api'

export const handler = async (event: any): Promise<void> => {
  console.log(`Event: ${JSON.stringify(event)}`)

  const tickers = await getTickers()
  console.log(tickers)

  let message = ''

  const cryptoTickers = tickers?.filter(x => x.type === TickerType.Crypto)
  const stocksTickers = tickers?.filter(x => x.type === TickerType.Stocks)

  if(stocksTickers.length) {
    message += 'Stocks:\n'

    for (const stocksTicker of stocksTickers) {
      const price = await getStockPrice(stocksTicker.key)

      if(price) {
        message += getMessageLine(stocksTicker, price)
      }
    }

    message += '\n'
  }

  if(cryptoTickers.length) {
    message += 'Cryptos:\n'
    for (const cryptoTicker of cryptoTickers) {
      const price = await getCryptoPrice(cryptoTicker.key)

      if(price) {
        message += getMessageLine(cryptoTicker, price)
      }
    }
  }
  


  if(message) {
    await sendMessage(message)
    console.log(`Published message: ${message}`)
  }
};

const getMessageLine = (ticker: Ticker, price: number) => {
  let line = ticker.name + ': ' + formatPrice(price)

  const { target } = ticker
  if(target) {
    line += ` (${ formatPercentage(price/target*100) }% of target)`
  }

  line += '\n'

  return line
}
