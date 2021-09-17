import { TickerType, Ticker } from "./ticker.interface";
import { constants } from '../constants'

import superagent = require('superagent');

export const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export const getPrice = async (ticker: Ticker, type: TickerType): Promise<string> => {
  let url = ''
  switch(type) {
    case TickerType.Stocks:
      url = `http://api.marketstack.com/v1/tickers/${ticker.key}/eod/latest?access_key=${constants.MARKET_STACK_ACCESS_KEY}`
      break
    case TickerType.Crypto:
      url = `https://www.mercadobitcoin.net/api/${ticker.key}/ticker/`
      break
    default:
      console.log(`Invalid type: ${type}`)
  }

  const { body } = await superagent.get(url)
  console.log(body);

  return formatPrice(body.close);
}
