import { MARKET_STACK_ACCESS_KEY, BOT_TOKEN, BOT_CHAT_ID } from './constants'
import { logger, getErrorDetails } from './logger'

import superagent = require('superagent');

export const sendMessage = async (message: string): Promise<void> => {
  await superagent
    .post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`)
    .send({ chat_id: BOT_CHAT_ID, parse_mode: 'Markdown', text: message })
    .timeout({ response: 5000, deadline: 10000 })
}

export const getCryptoPrice = async (key: string): Promise<number | undefined> => {
  const startedAt = Date.now()
  try {
    const response = await getRequest(`https://api.coinpaprika.com/v1/tickers/${encodeURIComponent(key)}?quotes=BRL`)
    const price = response.body?.quotes?.BRL?.price

    if (typeof price !== 'number' || !Number.isFinite(price)) {
      throw new Error('Missing or invalid BRL price in CoinPaprika response')
    }

    return price
  } catch (err) {
    logger.warn('price_lookup_failed', {
      provider: 'coinpaprika',
      ticker: key,
      durationMs: Date.now() - startedAt,
      ...getErrorDetails(err)
    })

    return undefined
  }
}

export const getStockPrice = async (key: string): Promise<number | undefined> => {
  const startedAt = Date.now()
  try {
    const response = await getRequest(`http://api.marketstack.com/v1/tickers/${ key }/eod/latest?access_key=${ MARKET_STACK_ACCESS_KEY }`)

    const price = response.body?.close
    if (typeof price !== 'number' || !Number.isFinite(price)) {
      throw new Error('Missing or invalid closing price in MarketStack response')
    }

    return price
  } catch (err) {
    logger.warn('price_lookup_failed', {
      provider: 'marketstack',
      ticker: key,
      durationMs: Date.now() - startedAt,
      ...getErrorDetails(err)
    })

    return undefined
  }
}

export const getRequest = async (url: string): Promise<any> => {
  return await superagent.get(url).timeout({ response: 3000, deadline: 5000 })
}
