import { TickerType, Ticker } from "./ticker.interface";
import { constants } from './constants'

import superagent = require('superagent');

export const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export const getPrice = async (ticker: Ticker, type: TickerType): Promise<string> => {
  let price = 0
  switch(type) {
    case TickerType.Stocks:
      const res = await getRequest(`http://api.marketstack.com/v1/tickers/${ticker.key}/eod/latest?access_key=${constants.MARKET_STACK_ACCESS_KEY}`)
      price = res.body.close
      break
    case TickerType.Crypto:
      const res2 = await getRequest(`https://www.mercadobitcoin.net/api/${ticker.key}/ticker/`)
      price = res2.body.ticker.last
      break
    default:
      throw new Error(`Invalid type: ${type}`)
  }

  return formatPrice(price);
}

export const getRequest = async (url: string): Promise<any> => {
  return await superagent.get(url)
}