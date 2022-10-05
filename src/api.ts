import { TickerType, Ticker } from "./ticker.interface";
import { MARKET_STACK_ACCESS_KEY } from './constants'

import superagent = require('superagent');

export const getCryptoPrice = async (key: string): Promise<number | undefined> => {
  try {
    const response = await getRequest(`https://www.mercadobitcoin.net/api/${ key }/ticker/`)

    return response.body.ticker.last
  } catch (err) {
    console.log(`Error getting crypto price of ${ key }`, err)

    return undefined
  }
}

export const getStockPrice = async (key: string): Promise<number | undefined> => {
  try {
    const response = await getRequest(`http://api.marketstack.com/v1/tickers/${ key }/eod/latest?access_key=${ MARKET_STACK_ACCESS_KEY }`)

    return response.body.close
  } catch (err) {
    console.log(`Error getting stock price of ${ key }`, err)

    return undefined
  }
}

export const getRequest = async (url: string): Promise<any> => {
  return await superagent.get(url)
}
